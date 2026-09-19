import { logger } from '../config/logger.js';
import { NOTIFICATION_TYPE } from '../constants/index.js';
import { enqueue } from '../jobs/queue.js';
import { Notification, Order, User } from '../models/index.js';
import { paginate } from '../utils/pagination.js';
import { AppError } from '../utils/AppError.js';
import { emailService } from './email.service.js';

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

/** Maps an order event to its in-app notification + email template. */
const ORDER_EVENTS = {
  placed: { type: NOTIFICATION_TYPE.ORDER_PLACED, template: 'orderConfirmation', title: (o) => `Order ${o.orderNumber} confirmed`, message: () => 'We have received your order and will start processing it shortly.' },
  paid: { type: NOTIFICATION_TYPE.PAYMENT_SUCCESS, template: 'paymentConfirmation', title: (o) => `Payment received for ${o.orderNumber}`, message: (o) => `Your payment of ₹${o.pricing.total} was successful.` },
  payment_failed: { type: NOTIFICATION_TYPE.PAYMENT_FAILED, template: 'paymentFailed', title: (o) => `Payment failed for ${o.orderNumber}`, message: () => 'Your payment did not go through. You can retry from the order page.', repeatable: true },
  shipped: { type: NOTIFICATION_TYPE.ORDER_SHIPPED, template: 'orderShipped', title: (o) => `Order ${o.orderNumber} shipped`, message: () => 'Your order is on its way.' },
  delivered: { type: NOTIFICATION_TYPE.ORDER_DELIVERED, template: 'orderDelivered', title: (o) => `Order ${o.orderNumber} delivered`, message: () => 'Your order has been delivered. Enjoy!' },
  cancelled: { type: NOTIFICATION_TYPE.ORDER_CANCELLED, template: 'orderCancelled', title: (o) => `Order ${o.orderNumber} cancelled`, message: (o) => o.cancellation?.reason || 'Your order has been cancelled.' },
  refunded: { type: NOTIFICATION_TYPE.REFUND, template: 'refund', title: (o) => `Refund processed for ${o.orderNumber}`, message: (o) => `₹${o.refund?.amount ?? 0} has been refunded.` },
  return_update: { type: NOTIFICATION_TYPE.RETURN, template: 'returnUpdate', title: (o) => `Return ${o.returnRequest?.status} – ${o.orderNumber}`, message: (o) => `Your return request is ${o.returnRequest?.status}.`, repeatable: true },
  status: { type: NOTIFICATION_TYPE.ORDER_STATUS, template: 'orderStatus', title: (o) => `Order ${o.orderNumber}: ${STATUS_LABELS[o.status]}`, message: (o) => `Your order is now ${STATUS_LABELS[o.status]}.`, repeatable: true },
};

async function sendEmailForNotification(notificationId, template, to, data) {
  try {
    await emailService.send(template, to, data);
    await Notification.updateOne({ _id: notificationId }, { $set: { 'email.status': 'sent', 'email.sentAt': new Date() } });
  } catch (err) {
    await Notification.updateOne({ _id: notificationId }, { $set: { 'email.status': 'failed', 'email.error': err.message } });
    throw err;
  }
}

export const notificationService = {
  STATUS_LABELS,

  /**
   * Creates an in-app notification and (optionally) queues an email.
   * Never throws – notification failures must not break business flows.
   */
  async notify({ userId, type, title, message, link, email }) {
    try {
      const notification = await Notification.create({
        user: userId,
        type,
        title,
        message,
        link,
        email: { status: email ? 'queued' : 'skipped' },
      });
      if (email) {
        enqueue(`email:${email.template}`, () => sendEmailForNotification(notification._id, email.template, email.to, email.data));
      }
      return notification;
    } catch (err) {
      logger.error({ err, type, userId }, 'Failed to create notification');
      return null;
    }
  },

  /** Sends a transactional email that has no in-app counterpart (verification, reset). */
  sendEmail(template, to, data) {
    return enqueue(`email:${template}`, () => emailService.send(template, to, data));
  },

  /**
   * Order lifecycle notification. Idempotent for one-off events
   * (placed/paid/shipped/delivered/cancelled/refunded) via order.notificationsSent.
   * @param {object} order Order document or lean object
   * @param {keyof typeof ORDER_EVENTS} event
   */
  async orderEvent(order, event) {
    const def = ORDER_EVENTS[event];
    if (!def) return null;
    try {
      if (!def.repeatable) {
        const claimed = await Order.updateOne({ _id: order._id, notificationsSent: { $ne: event } }, { $addToSet: { notificationsSent: event } });
        if (claimed.modifiedCount === 0) return null;
      }
      const user = await User.findById(order.user).select('email preferences').lean();
      const wantsEmail = user?.preferences?.orderUpdates !== false || ['placed', 'paid', 'cancelled', 'refunded'].includes(event);
      return this.notify({
        userId: order.user,
        type: def.type,
        title: def.title(order),
        message: def.message(order),
        link: `/account/orders/${order._id}`,
        email: wantsEmail
          ? { template: def.template, to: order.contact?.email || user?.email, data: { order, statusLabel: STATUS_LABELS[order.status] } }
          : undefined,
      });
    } catch (err) {
      logger.error({ err, event, orderId: order._id }, 'Order notification failed');
      return null;
    }
  },

  async list(userId, { page, limit, unreadOnly }) {
    const filter = { user: userId, ...(unreadOnly && { isRead: false }) };
    const [result, unreadCount] = await Promise.all([
      paginate(Notification, filter, { page, limit, sort: { createdAt: -1 }, select: '-email.error' }),
      Notification.countDocuments({ user: userId, isRead: false }),
    ]);
    return { ...result, unreadCount };
  },

  async markRead(userId, id) {
    const n = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { returnDocument: 'after' },
    ).lean();
    if (!n) throw AppError.notFound('Notification not found');
    return n;
  },

  async markAllRead(userId) {
    const res = await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true, readAt: new Date() } });
    return { updated: res.modifiedCount };
  },

  async remove(userId, id) {
    const res = await Notification.deleteOne({ _id: id, user: userId });
    if (!res.deletedCount) throw AppError.notFound('Notification not found');
  },
};
