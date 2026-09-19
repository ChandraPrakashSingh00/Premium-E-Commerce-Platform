import mongoose from 'mongoose';
import { logger } from '../config/logger.js';
import {
  INVENTORY_STATE,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_RECORD_STATUS,
  PAYMENT_STATUS,
} from '../constants/index.js';
import { razorpay } from '../integrations/razorpay.js';
import { Address, Cart, Counter, Order, Payment } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { isDuplicateKeyError, pick, toPaise } from '../utils/helpers.js';
import { withTransaction } from '../utils/transaction.js';
import { cartService } from './cart.service.js';
import { couponService } from './coupon.service.js';
import { inventoryService } from './inventory.service.js';
import { notificationService } from './notification.service.js';
import { orderLifecycle } from './orderLifecycle.service.js';
import { pricingService } from './pricing.service.js';
import { settingsService } from './settings.service.js';

const ADDRESS_FIELDS = ['fullName', 'phone', 'addressLine1', 'addressLine2', 'landmark', 'city', 'state', 'postalCode', 'country'];
const opts = (session) => (session ? { session } : {});

/** Sequential, human-friendly order number: ORD-2026-000001. */
export async function generateOrderNumber(date = new Date()) {
  const year = date.getFullYear();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: `order-${year}` },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' },
      ).lean();
      return `ORD-${year}-${String(counter.seq).padStart(6, '0')}`;
    } catch (err) {
      if (!isDuplicateKeyError(err)) throw err; // concurrent upsert – retry
    }
  }
  throw new AppError('Could not allocate an order number', 500);
}

function codAvailability(settings, total) {
  if (!settings.codEnabled) return { codAvailable: false, codUnavailableReason: 'Cash on delivery is currently unavailable' };
  if (total > settings.codMaxOrderAmount) {
    return {
      codAvailable: false,
      codUnavailableReason: `Cash on delivery is available only for orders up to ₹${settings.codMaxOrderAmount}`,
    };
  }
  return { codAvailable: true };
}

export function buildRazorpayCheckout(order, payment) {
  return {
    provider: 'razorpay',
    keyId: razorpay.publicKey(),
    razorpayOrderId: payment.razorpayOrderId,
    amount: toPaise(payment.amount),
    currency: 'INR',
    orderId: order._id,
    orderNumber: order.orderNumber,
    prefill: { name: order.contact.name, email: order.contact.email, contact: order.contact.phone },
  };
}

export const isPayable = (order) =>
  order.paymentMethod === PAYMENT_METHOD.RAZORPAY &&
  order.status === ORDER_STATUS.PENDING &&
  ![PAYMENT_STATUS.PAID, PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(order.paymentStatus) &&
  order.inventoryState === INVENTORY_STATE.RESERVED &&
  Boolean(order.reservationExpiresAt) &&
  new Date(order.reservationExpiresAt) > new Date();

/** Returns checkout data for a payable order, creating a gateway order when needed. */
async function ensureGatewayOrder(order, { forceNew = false } = {}) {
  const payment = await Payment.findOne({ order: order._id });
  if (!payment) throw AppError.conflict('No payment record found for this order');
  const reusable =
    !forceNew &&
    payment.razorpayOrderId &&
    [PAYMENT_RECORD_STATUS.CREATED, PAYMENT_RECORD_STATUS.FAILED].includes(payment.status) &&
    payment.amount === order.pricing.total;
  if (reusable) return buildRazorpayCheckout(order, payment);

  const gatewayOrder = await razorpay.createOrder({
    amountPaise: toPaise(order.pricing.total),
    receipt: order.orderNumber,
    notes: { orderId: String(order._id) },
  });
  const updated = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $nin: [PAYMENT_RECORD_STATUS.CAPTURED] } },
    { $set: { razorpayOrderId: gatewayOrder.id, amount: order.pricing.total, status: PAYMENT_RECORD_STATUS.CREATED } },
    { returnDocument: 'after' },
  );
  if (!updated) throw AppError.conflict('This order has already been paid');
  return buildRazorpayCheckout(order, updated);
}

async function existingOrderResponse(order) {
  let payment = null;
  if (isPayable(order)) payment = await ensureGatewayOrder(order);
  return { order, payment, created: false };
}

export const checkoutService = {
  async quote(userId, paymentMethod) {
    const cart = await Cart.findOne({ user: userId }).lean();
    const lines = (cart?.items ?? []).map((i) => ({ _id: i._id, variantId: i.variant, quantity: i.quantity }));
    const [view, settings] = await Promise.all([
      pricingService.buildCartView({ lines, couponCode: cart?.couponCode, userId, paymentMethod }),
      settingsService.get(),
    ]);
    // COD eligibility is judged on the COD total (including the COD fee), whatever method was quoted.
    const codTotal = paymentMethod === PAYMENT_METHOD.COD ? view.summary.total : view.summary.total + (settings.codFee || 0);
    return { ...view, ...codAvailability(settings, codTotal) };
  },

  /**
   * Creates an order from the user's cart. Idempotent per (user, idempotencyKey).
   * @returns {Promise<{order, payment, created: boolean}>}
   */
  async placeOrder(user, { addressId, contact, paymentMethod, customerNote }, idempotencyKey) {
    const userId = user._id;
    const existing = await Order.findOne({ user: userId, idempotencyKey });
    if (existing) return existingOrderResponse(existing);

    const isCod = paymentMethod === PAYMENT_METHOD.COD;
    if (!isCod && !razorpay.isEnabled()) throw AppError.badRequest('Online payments are currently unavailable');

    const settings = await settingsService.get();
    const cart = await Cart.findOne({ user: userId }).lean();
    if (!cart?.items?.length) throw AppError.conflict('Your cart is empty');
    const lines = cart.items.map((i) => ({ _id: i._id, variantId: i.variant, quantity: i.quantity }));
    const view = await pricingService.buildCartView({ lines, couponCode: cart.couponCode, userId, paymentMethod });
    if (view.hasIssues) {
      const errors = view.items
        .filter((i) => i.issue)
        .map((i) => ({ field: String(i.variantId), message: `${i.name}: ${i.issue.replace(/_/g, ' ')}` }));
      throw AppError.conflict('Some items in your cart need attention', errors);
    }
    if (view.couponError) throw AppError.unprocessable(view.couponError);
    if (!view.lines.length) throw AppError.conflict('Your cart is empty');

    const address = await Address.findOne({ _id: addressId, user: userId }).lean();
    if (!address) throw AppError.notFound('Address not found');

    const { total } = view.summary;
    if (isCod) {
      const cod = codAvailability(settings, total);
      if (!cod.codAvailable) throw AppError.badRequest(cod.codUnavailableReason);
    }

    const now = new Date();
    const orderId = new mongoose.Types.ObjectId();
    const paymentId = new mongoose.Types.ObjectId();
    const orderNumber = await generateOrderNumber(now);
    const history = [{ status: ORDER_STATUS.PENDING, note: 'Order placed', at: now }];
    if (isCod) history.push({ status: ORDER_STATUS.CONFIRMED, note: 'Cash on delivery order confirmed', at: now });

    const orderDoc = {
      _id: orderId,
      orderNumber,
      user: userId,
      idempotencyKey,
      items: view.lines,
      contact,
      shippingAddress: pick(address, ADDRESS_FIELDS),
      pricing: { ...pick(view.summary, ['subtotal', 'discount', 'couponDiscount', 'tax', 'shipping', 'codFee', 'total']), currency: 'INR' },
      ...(view.coupon && { coupon: { code: view.coupon.code, couponId: view.couponId } }),
      paymentMethod,
      paymentStatus: PAYMENT_STATUS.PENDING,
      payment: paymentId,
      status: isCod ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PENDING,
      statusHistory: history,
      inventoryState: isCod ? INVENTORY_STATE.COMMITTED : INVENTORY_STATE.RESERVED,
      ...(!isCod && { reservationExpiresAt: new Date(now.getTime() + settings.reservationTtlMinutes * 60_000) }),
      customerNote,
    };

    let order;
    try {
      order = await withTransaction(async (session) => {
        const undo = []; // compensations for deployments without transactions
        try {
          const [created] = await Order.create([orderDoc], opts(session));
          undo.push(() => Order.deleteOne({ _id: orderId }));

          await inventoryService.reserve(view.lines, { orderId, session });
          undo.push(() => inventoryService.release(view.lines, { orderId }));
          if (isCod) {
            await inventoryService.commit(view.lines, { orderId, session });
            undo[undo.length - 1] = () => inventoryService.returnStock(view.lines, { orderId });
          }

          if (view.coupon) {
            await couponService.redeem(view.couponId, { userId, orderId, discountAmount: view.summary.couponDiscount, session });
            undo.push(() => couponService.release(orderId));
          }
          await Payment.create(
            [{ _id: paymentId, order: orderId, user: userId, method: paymentMethod, status: PAYMENT_RECORD_STATUS.CREATED, amount: total }],
            opts(session),
          );
          return created;
        } catch (err) {
          if (!session) {
            for (const fn of undo.reverse()) {
              await fn().catch((e) => logger.error({ err: e, orderId }, 'Checkout compensation failed'));
            }
          }
          throw err;
        }
      });
    } catch (err) {
      if (isDuplicateKeyError(err) && (err.keyPattern?.idempotencyKey || /idempotencyKey/.test(err.message))) {
        const winner = await Order.findOne({ user: userId, idempotencyKey });
        if (winner) return existingOrderResponse(winner);
      }
      throw err;
    }

    await cartService.clearAfterCheckout(userId);
    logger.info({ orderId, orderNumber, paymentMethod, total }, 'Order placed');

    if (isCod) {
      await notificationService.orderEvent(order, 'placed');
      return { order, payment: null, created: true };
    }

    try {
      const payment = await ensureGatewayOrder(order, { forceNew: true });
      return { order, payment, created: true };
    } catch (err) {
      logger.error({ err, orderId }, 'Gateway order creation failed – cancelling order');
      await orderLifecycle
        .cancelOrder({ orderId, by: 'system', reason: 'Payment gateway unavailable' })
        .catch((e) => logger.error({ err: e, orderId }, 'Failed to cancel order after gateway error'));
      if (err instanceof AppError && err.statusCode >= 500) throw err;
      throw new AppError('Payment gateway is unavailable, please try again', 502, [], 'PAYMENT_GATEWAY_ERROR');
    }
  },

  /** Retry payment for a pending online order. */
  async retryPayment(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw AppError.notFound('Order not found');
    if (!isPayable(order)) throw AppError.conflict('This order can no longer be paid');
    const payment = await ensureGatewayOrder(order);
    return { order, payment };
  },
};
