import { logger } from '../config/logger.js';
import {
  ORDER_STATUS,
  ORDER_TRANSITIONS,
  PAYMENT_METHOD,
  PAYMENT_RECORD_STATUS,
  PAYMENT_STATUS,
  REFUND_STATUS,
} from '../constants/index.js';
import { razorpay } from '../integrations/razorpay.js';
import { Order, Payment } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { roundMoney, toPaise } from '../utils/helpers.js';
import { notificationService } from './notification.service.js';

const REFUNDABLE = [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIALLY_REFUNDED];
const EPSILON = 0.005;

/** Order-level update after a refund was accepted (pending or processed). */
async function applyToOrder(order, { amountRefunded, total, status, refundId, reason }) {
  const fully = amountRefunded >= total - EPSILON;
  const now = new Date();
  const set = {
    paymentStatus: fully ? PAYMENT_STATUS.REFUNDED : PAYMENT_STATUS.PARTIALLY_REFUNDED,
    'refund.status': status,
    'refund.amount': roundMoney(amountRefunded),
    'refund.initiatedAt': now,
    ...(refundId && { 'refund.razorpayRefundId': refundId }),
    ...(reason && { 'refund.reason': reason }),
    ...(status === REFUND_STATUS.PROCESSED && { 'refund.processedAt': now }),
  };
  const toRefunded = fully && ORDER_TRANSITIONS[order.status]?.includes(ORDER_STATUS.REFUNDED);
  if (toRefunded) {
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status },
      {
        $set: { ...set, status: ORDER_STATUS.REFUNDED },
        $push: { statusHistory: { status: ORDER_STATUS.REFUNDED, note: reason || 'Refund initiated', at: now } },
      },
      { returnDocument: 'after' },
    );
    if (updated) return updated;
  }
  // No status change (or status moved concurrently): still record the refund itself.
  return Order.findOneAndUpdate({ _id: order._id }, { $set: set }, { returnDocument: 'after' });
}

export const refundService = {
  /**
   * Refunds (part of) a paid order. Guards against refunding more than was paid by
   * atomically reserving the amount on the Payment before calling the gateway.
   * @returns {Promise<import('mongoose').Document>} updated order
   */
  async initiateRefund(orderOrId, { amount, reason } = {}) {
    const order = await Order.findById(orderOrId?._id ?? orderOrId);
    if (!order) throw AppError.notFound('Order not found');
    if (!REFUNDABLE.includes(order.paymentStatus)) throw AppError.conflict('This order has no captured payment to refund');

    const payment = await Payment.findOne({ order: order._id });
    if (!payment) throw AppError.conflict('No payment record found for this order');
    const total = roundMoney(payment.amount);
    const remaining = roundMoney(total - payment.amountRefunded);
    const value = roundMoney(amount ?? remaining);
    if (value <= 0 || value > remaining + EPSILON) {
      throw AppError.conflict(`Refund amount exceeds the refundable balance of ₹${remaining}`);
    }
    const isOnline = payment.method === PAYMENT_METHOD.RAZORPAY;
    if (isOnline && !payment.razorpayPaymentId) throw AppError.conflict('No captured online payment to refund');

    // Claim the amount (optimistic on amountRefunded) so concurrent refunds cannot over-refund.
    const claimed = await Payment.findOneAndUpdate(
      { _id: payment._id, amountRefunded: payment.amountRefunded },
      { $inc: { amountRefunded: value } },
      { returnDocument: 'after' },
    );
    if (!claimed) throw AppError.conflict('Another refund is in progress, please retry');

    let status = REFUND_STATUS.PROCESSED; // COD refunds are settled manually
    let refundId;
    if (isOnline) {
      try {
        const res = await razorpay.refund({
          paymentId: payment.razorpayPaymentId,
          amountPaise: toPaise(value),
          notes: { orderId: String(order._id), reason: reason ?? '' },
          receipt: `${order.orderNumber}-r${claimed.refunds.length + 1}`.slice(0, 40),
        });
        refundId = res.id;
        status = res.status === 'processed' ? REFUND_STATUS.PROCESSED : REFUND_STATUS.PENDING;
      } catch (err) {
        await Payment.updateOne(
          { _id: payment._id },
          { $inc: { amountRefunded: -value }, $push: { refunds: { amount: value, status: 'failed', reason } } },
        );
        await Order.updateOne({ _id: order._id }, { $set: { 'refund.status': REFUND_STATUS.FAILED, 'refund.reason': reason } });
        logger.error({ err, orderId: order._id }, 'Refund failed at gateway');
        throw err;
      }
    }

    const fully = claimed.amountRefunded >= total - EPSILON;
    await Payment.updateOne(
      { _id: payment._id },
      {
        $set: { status: fully ? PAYMENT_RECORD_STATUS.REFUNDED : PAYMENT_RECORD_STATUS.PARTIALLY_REFUNDED },
        $push: { refunds: { razorpayRefundId: refundId, amount: value, status, reason } },
      },
    );
    const updated = await applyToOrder(order, { amountRefunded: claimed.amountRefunded, total, status, refundId, reason });
    if (status === REFUND_STATUS.PROCESSED) await notificationService.orderEvent(updated, 'refunded');
    logger.info({ orderId: order._id, amount: value, status }, 'Refund initiated');
    return updated;
  },

  /** Applies a `refund.processed` / `refund.failed` webhook. Idempotent. */
  async applyRefundEvent(entity, outcome) {
    const target = outcome === 'processed' ? 'processed' : 'failed';
    const payment = await Payment.findOneAndUpdate(
      { refunds: { $elemMatch: { razorpayRefundId: entity.id, status: 'pending' } } },
      { $set: { 'refunds.$.status': target } },
      { returnDocument: 'after' },
    );
    if (!payment) return 'Refund already up to date or unknown';

    const refund = payment.refunds.find((r) => r.razorpayRefundId === entity.id);
    const orderUpdate = { $set: { 'refund.status': target } };
    if (target === 'processed') {
      orderUpdate.$set['refund.processedAt'] = new Date();
    } else {
      const remainingRefunded = roundMoney(Math.max(0, payment.amountRefunded - refund.amount));
      await Payment.updateOne(
        { _id: payment._id },
        {
          $set: {
            amountRefunded: remainingRefunded,
            status: remainingRefunded > 0 ? PAYMENT_RECORD_STATUS.PARTIALLY_REFUNDED : PAYMENT_RECORD_STATUS.CAPTURED,
          },
        },
      );
      orderUpdate.$set.paymentStatus = remainingRefunded > 0 ? PAYMENT_STATUS.PARTIALLY_REFUNDED : PAYMENT_STATUS.PAID;
      orderUpdate.$set['refund.amount'] = remainingRefunded;
    }
    const order = await Order.findOneAndUpdate({ _id: payment.order }, orderUpdate, { returnDocument: 'after' });
    if (order && target === 'processed') await notificationService.orderEvent(order, 'refunded');
    if (target === 'failed') logger.error({ orderId: payment.order, refundId: entity.id }, 'Refund failed');
    return `Refund ${target}`;
  },
};
