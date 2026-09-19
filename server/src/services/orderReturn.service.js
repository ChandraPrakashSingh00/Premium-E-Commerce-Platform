import { logger } from '../config/logger.js';
import { INVENTORY_STATE, ORDER_STATUS, PAYMENT_STATUS, RETURN_STATUS } from '../constants/index.js';
import { Order } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { withTransaction } from '../utils/transaction.js';
import { inventoryService } from './inventory.service.js';
import { notificationService } from './notification.service.js';
import { refundService } from './refund.service.js';
import { settingsService } from './settings.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const opts = (session) => (session ? { session } : {});

/** Whether a delivered order is still inside the return window. */
export const isWithinReturnWindow = (order, windowDays) => {
  const deliveredAt = order.tracking?.deliveredAt;
  return Boolean(deliveredAt) && Date.now() - new Date(deliveredAt).getTime() <= windowDays * DAY_MS;
};

async function resolveTransition(orderId, from, set, note) {
  const order = await Order.findOneAndUpdate(
    { _id: orderId, 'returnRequest.status': from },
    { $set: { ...set, ...(note && { 'returnRequest.adminNote': note }) } },
    { returnDocument: 'after' },
  );
  if (!order) {
    const exists = await Order.exists({ _id: orderId });
    if (!exists) throw AppError.notFound('Order not found');
    throw AppError.conflict(`Only ${from} return requests can be updated this way`);
  }
  await notificationService.orderEvent(order, 'return_update');
  return order;
}

export const orderReturnService = {
  /** Customer return request for a delivered order within the return window. */
  async request(userId, orderId, { reason, comment }) {
    const { returnWindowDays } = await settingsService.get();
    const now = new Date();
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        user: userId,
        status: ORDER_STATUS.DELIVERED,
        'returnRequest.status': null,
        'tracking.deliveredAt': { $gte: new Date(now.getTime() - returnWindowDays * DAY_MS) },
      },
      { $set: { returnRequest: { status: RETURN_STATUS.REQUESTED, reason, comment, requestedAt: now } } },
      { returnDocument: 'after' },
    );
    if (!order) {
      const current = await Order.findOne({ _id: orderId, user: userId }).lean();
      if (!current) throw AppError.notFound('Order not found');
      if (current.returnRequest?.status) throw AppError.conflict('A return has already been requested for this order');
      if (current.status !== ORDER_STATUS.DELIVERED) throw AppError.conflict('Only delivered orders can be returned');
      throw AppError.conflict(`The ${returnWindowDays}-day return window for this order has closed`);
    }
    await notificationService.orderEvent(order, 'return_update');
    return order;
  },

  approve: (orderId, note) =>
    resolveTransition(orderId, RETURN_STATUS.REQUESTED, { 'returnRequest.status': RETURN_STATUS.APPROVED }, note),

  reject: (orderId, note) =>
    resolveTransition(
      orderId,
      RETURN_STATUS.REQUESTED,
      { 'returnRequest.status': RETURN_STATUS.REJECTED, 'returnRequest.resolvedAt': new Date() },
      note,
    ),

  /** Receives the returned goods: restocks and refunds the captured amount. */
  async complete(orderId, note, actorId) {
    const order = await Order.findById(orderId);
    if (!order) throw AppError.notFound('Order not found');
    if (order.returnRequest?.status !== RETURN_STATUS.APPROVED) {
      throw AppError.conflict('The return must be approved before it can be completed');
    }
    if (order.status !== ORDER_STATUS.DELIVERED) throw AppError.conflict('Only delivered orders can be returned');

    const now = new Date();
    const updated = await withTransaction(async (session) => {
      const u = await Order.findOneAndUpdate(
        { _id: order._id, status: ORDER_STATUS.DELIVERED, 'returnRequest.status': RETURN_STATUS.APPROVED },
        {
          $set: {
            status: ORDER_STATUS.RETURNED,
            inventoryState: INVENTORY_STATE.RETURNED,
            'returnRequest.status': RETURN_STATUS.COMPLETED,
            'returnRequest.resolvedAt': now,
            ...(note && { 'returnRequest.adminNote': note }),
          },
          $push: { statusHistory: { status: ORDER_STATUS.RETURNED, note: note || 'Return received', by: actorId, at: now } },
        },
        { returnDocument: 'after', ...opts(session) },
      );
      if (!u) throw AppError.conflict('The order was updated in the meantime, please retry');
      if (order.inventoryState === INVENTORY_STATE.COMMITTED) {
        await inventoryService.returnStock(order.items, { orderId: order._id, session });
      }
      return u;
    });

    await notificationService.orderEvent(updated, 'return_update');
    if ([PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIALLY_REFUNDED].includes(updated.paymentStatus)) {
      try {
        return await refundService.initiateRefund(updated, { reason: 'Return completed' });
      } catch (err) {
        logger.error({ err, orderId: order._id }, 'Refund after return failed');
        return Order.findById(order._id);
      }
    }
    return updated;
  },
};
