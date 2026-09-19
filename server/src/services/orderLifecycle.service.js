import { logger } from '../config/logger.js';
import {
  CUSTOMER_CANCELLABLE,
  INVENTORY_STATE,
  ORDER_STATUS,
  ORDER_TRANSITIONS,
  PAYMENT_METHOD,
  PAYMENT_RECORD_STATUS,
  PAYMENT_STATUS,
} from '../constants/index.js';
import { Order, Payment } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { couponService } from './coupon.service.js';
import { inventoryService } from './inventory.service.js';
import { notificationService } from './notification.service.js';
import { refundService } from './refund.service.js';

const { PAID, REFUNDED, PARTIALLY_REFUNDED } = PAYMENT_STATUS;
const SETTLED = [PAID, REFUNDED, PARTIALLY_REFUNDED];
const opts = (session) => (session ? { session } : {});

/** Marks the Payment record captured (once) and logs the attempt. */
async function recordCapture(orderId, { razorpayPaymentId, source, method }, session = null) {
  const now = new Date();
  await Payment.updateOne(
    {
      order: orderId,
      status: { $in: [PAYMENT_RECORD_STATUS.CREATED, PAYMENT_RECORD_STATUS.FAILED, PAYMENT_RECORD_STATUS.AUTHORIZED, PAYMENT_RECORD_STATUS.CANCELLED] },
    },
    {
      $set: {
        status: PAYMENT_RECORD_STATUS.CAPTURED,
        capturedAt: now,
        ...(razorpayPaymentId && { razorpayPaymentId }),
        ...(method && { paymentMode: method }),
      },
      $unset: { failureReason: 1 },
      $push: { attempts: { razorpayPaymentId, status: 'captured', method, source, at: now } },
    },
    opts(session),
  );
}

/** Inside a transaction errors must abort it; without one, log and keep the (already claimed) state. */
async function stockStep(session, fn, context) {
  try {
    await fn();
  } catch (err) {
    if (session) throw err;
    logger.error({ err, ...context }, 'Inventory step failed without transaction – manual reconciliation needed');
  }
}

async function notifyPaid(order) {
  await notificationService.orderEvent(order, 'placed');
  await notificationService.orderEvent(order, 'paid');
}

/**
 * Payment captured after the order was cancelled. System-cancelled (expired) orders
 * are reinstated if stock is still available; otherwise the payment is refunded.
 */
async function handleLateCapture(order, ctx) {
  const now = new Date();
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: ORDER_STATUS.CANCELLED, paymentStatus: { $nin: SETTLED } },
    { $set: { paymentStatus: PAID, paidAt: now } },
    { returnDocument: 'after' },
  );
  if (!claimed) return Order.findById(order._id);
  await recordCapture(order._id, ctx);
  logger.warn({ orderId: order._id, orderNumber: order.orderNumber }, 'Payment captured after order cancellation');

  let reinstated = null;
  if (claimed.inventoryState === INVENTORY_STATE.RELEASED && claimed.cancellation?.cancelledBy === 'system') {
    try {
      reinstated = await withTransaction(async (session) => {
        await inventoryService.sellDirect(claimed.items, { orderId: claimed._id, session });
        return Order.findOneAndUpdate(
          { _id: claimed._id, status: ORDER_STATUS.CANCELLED },
          {
            $set: { status: ORDER_STATUS.CONFIRMED, inventoryState: INVENTORY_STATE.COMMITTED },
            $unset: { cancellation: 1 },
            $push: {
              statusHistory: { status: ORDER_STATUS.CONFIRMED, note: 'Payment received after reservation expired – order reinstated', at: now },
            },
          },
          { returnDocument: 'after', ...opts(session) },
        );
      });
    } catch (err) {
      if (!(err instanceof AppError)) logger.error({ err, orderId: order._id }, 'Failed to reinstate late-paid order');
      reinstated = null;
    }
  }

  if (reinstated) {
    if (reinstated.coupon?.couponId) {
      await couponService
        .redeem(reinstated.coupon.couponId, {
          userId: reinstated.user,
          orderId: reinstated._id,
          discountAmount: reinstated.pricing.couponDiscount,
        })
        .catch((err) => logger.warn({ err, orderId: reinstated._id }, 'Coupon could not be re-redeemed for reinstated order'));
    }
    logger.info({ orderId: order._id }, 'Late-paid order reinstated');
    await notifyPaid(reinstated);
    return reinstated;
  }

  logger.warn({ orderId: order._id }, 'Late payment cannot be fulfilled – refunding');
  try {
    return await refundService.initiateRefund(claimed, { reason: 'Payment received after the order was cancelled' });
  } catch (err) {
    logger.error({ err, orderId: order._id }, 'Automatic refund for late payment failed');
    return Order.findById(order._id);
  }
}

export const orderLifecycle = {
  /**
   * Idempotently marks an online order paid + confirmed and commits its stock.
   * Safe to call from the verify endpoint, webhooks and the expiry job concurrently.
   */
  async confirmPayment({ order, razorpayPaymentId, source = 'system', method }) {
    const orderId = order._id;
    const ctx = { razorpayPaymentId, source, method };
    const now = new Date();

    const confirmed = await withTransaction(async (session) => {
      const claimed = await Order.findOneAndUpdate(
        { _id: orderId, paymentStatus: { $nin: SETTLED }, status: ORDER_STATUS.PENDING, inventoryState: INVENTORY_STATE.RESERVED },
        {
          $set: { paymentStatus: PAID, paidAt: now, status: ORDER_STATUS.CONFIRMED, inventoryState: INVENTORY_STATE.COMMITTED },
          $push: { statusHistory: { status: ORDER_STATUS.CONFIRMED, note: 'Payment received', at: now } },
        },
        { returnDocument: 'after', ...opts(session) },
      );
      if (!claimed) return null;
      await stockStep(session, () => inventoryService.commit(claimed.items, { orderId, session }), { orderId });
      await recordCapture(orderId, ctx, session);
      return claimed;
    });

    if (confirmed) {
      logger.info({ orderId, source }, 'Payment confirmed');
      await notifyPaid(confirmed);
      return confirmed;
    }

    const current = await Order.findById(orderId);
    if (!current) throw AppError.notFound('Order not found');
    if (SETTLED.includes(current.paymentStatus)) return current; // already processed
    if (current.status === ORDER_STATUS.CANCELLED) return handleLateCapture(current, ctx);
    logger.warn({ orderId, status: current.status, inventoryState: current.inventoryState }, 'Payment captured for order in unexpected state');
    return current;
  },

  /**
   * Cancels an order: releases reserved stock or returns committed stock, gives the
   * coupon back and refunds captured payments.
   * @param {{orderId:any, by:'customer'|'admin'|'system', reason?:string, userId?:any, actorId?:any}} p
   */
  async cancelOrder({ orderId, by, reason, userId, actorId }) {
    const order = await Order.findOne({ _id: orderId, ...(userId && { user: userId }) });
    if (!order) throw AppError.notFound('Order not found');
    if (order.status === ORDER_STATUS.CANCELLED) throw AppError.conflict('This order is already cancelled');
    const allowed =
      by === 'customer'
        ? CUSTOMER_CANCELLABLE.includes(order.status)
        : ORDER_TRANSITIONS[order.status]?.includes(ORDER_STATUS.CANCELLED);
    if (!allowed) throw AppError.conflict('This order can no longer be cancelled');

    const now = new Date();
    const state = order.inventoryState;
    const text = reason?.trim() || (by === 'customer' ? 'Cancelled by customer' : 'Cancelled');
    const updated = await withTransaction(async (session) => {
      const u = await Order.findOneAndUpdate(
        { _id: order._id, status: order.status, inventoryState: state },
        {
          $set: {
            status: ORDER_STATUS.CANCELLED,
            inventoryState: [INVENTORY_STATE.RESERVED, INVENTORY_STATE.COMMITTED].includes(state) ? INVENTORY_STATE.RELEASED : state,
            cancellation: { reason: text, cancelledBy: by, cancelledAt: now },
          },
          $push: { statusHistory: { status: ORDER_STATUS.CANCELLED, note: text, by: actorId ?? userId, at: now } },
        },
        { returnDocument: 'after', ...opts(session) },
      );
      if (!u) throw AppError.conflict('The order was updated in the meantime, please retry');
      const ctx = { orderId: order._id, session };
      if (state === INVENTORY_STATE.RESERVED) {
        await stockStep(session, () => inventoryService.release(order.items, ctx), { orderId: order._id });
      } else if (state === INVENTORY_STATE.COMMITTED) {
        await stockStep(session, () => inventoryService.returnStock(order.items, ctx), { orderId: order._id });
      }
      await couponService.release(order._id, session);
      await Payment.updateOne(
        { order: order._id, status: { $in: [PAYMENT_RECORD_STATUS.CREATED, PAYMENT_RECORD_STATUS.FAILED] } },
        { $set: { status: PAYMENT_RECORD_STATUS.CANCELLED } },
        opts(session),
      );
      return u;
    });

    logger.info({ orderId: order._id, by }, 'Order cancelled');
    await notificationService.orderEvent(updated, 'cancelled');
    if (SETTLED.includes(updated.paymentStatus) && updated.paymentStatus !== REFUNDED) {
      try {
        return await refundService.initiateRefund(updated, { reason: `Order cancelled: ${text}` });
      } catch (err) {
        logger.error({ err, orderId: order._id }, 'Automatic refund after cancellation failed');
        return Order.findById(order._id);
      }
    }
    return updated;
  },

  /** Admin status change with transition validation. */
  async updateStatus({ orderId, status, note, tracking, actorId }) {
    if (status === ORDER_STATUS.CANCELLED) {
      return this.cancelOrder({ orderId, by: 'admin', reason: note || 'Cancelled by the store', actorId });
    }
    if (status === ORDER_STATUS.RETURNED) throw AppError.conflict('Use the return workflow to mark an order as returned');
    if (status === ORDER_STATUS.REFUNDED) throw AppError.conflict('Use the refund action to refund an order');

    const order = await Order.findById(orderId);
    if (!order) throw AppError.notFound('Order not found');
    if (!ORDER_TRANSITIONS[order.status]?.includes(status)) {
      throw AppError.conflict(`Cannot change order status from ${order.status} to ${status}`);
    }
    const isCod = order.paymentMethod === PAYMENT_METHOD.COD;
    if (status === ORDER_STATUS.CONFIRMED && !isCod && order.paymentStatus !== PAID) {
      throw AppError.conflict('Online orders are confirmed automatically once payment is received');
    }

    const now = new Date();
    const set = { status };
    for (const [key, value] of Object.entries(tracking ?? {})) {
      if (value !== undefined) set[`tracking.${key}`] = value;
    }
    if ([ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY].includes(status) && !order.tracking?.shippedAt) {
      set['tracking.shippedAt'] = now;
    }
    const codCollected = status === ORDER_STATUS.DELIVERED && isCod && order.paymentStatus !== PAID;
    if (status === ORDER_STATUS.DELIVERED) {
      set['tracking.deliveredAt'] = now;
      if (!order.tracking?.shippedAt) set['tracking.shippedAt'] = now;
      if (codCollected) Object.assign(set, { paymentStatus: PAID, paidAt: now });
    }
    const commitStock = status === ORDER_STATUS.CONFIRMED && order.inventoryState === INVENTORY_STATE.RESERVED;
    if (commitStock) set.inventoryState = INVENTORY_STATE.COMMITTED;

    const updated = await withTransaction(async (session) => {
      const u = await Order.findOneAndUpdate(
        { _id: order._id, status: order.status },
        { $set: set, $push: { statusHistory: { status, note, by: actorId, at: now } } },
        { returnDocument: 'after', runValidators: true, ...opts(session) },
      );
      if (!u) throw AppError.conflict('The order was updated in the meantime, please retry');
      if (commitStock) {
        await stockStep(session, () => inventoryService.commit(order.items, { orderId: order._id, session }), { orderId: order._id });
      }
      if (codCollected) await recordCapture(order._id, { source: 'system', method: 'cod' }, session);
      return u;
    });

    const event = { [ORDER_STATUS.SHIPPED]: 'shipped', [ORDER_STATUS.DELIVERED]: 'delivered' }[status] ?? 'status';
    await notificationService.orderEvent(updated, event);
    return updated;
  },

  recordCapture,
};
