import {
  ORDER_STATUS,
  ORDER_TRANSITIONS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from '../constants/index.js';
import { Order, Payment } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex } from '../utils/helpers.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { notificationService } from './notification.service.js';
import { toOrderSummary } from './order.service.js';
import { orderLifecycle } from './orderLifecycle.service.js';
import { orderReturnService } from './orderReturn.service.js';
import { refundService } from './refund.service.js';

/** Transitions an admin can apply through PATCH /status. */
const adminTransitions = (status) =>
  (ORDER_TRANSITIONS[status] ?? []).filter((s) => ![ORDER_STATUS.RETURNED, ORDER_STATUS.REFUNDED].includes(s));

async function detail(orderId) {
  const order = await Order.findById(orderId).populate('user', 'name email phone').lean();
  if (!order) throw AppError.notFound('Order not found');
  const payment = await Payment.findOne({ order: order._id }).lean();
  const { user, ...rest } = order;
  return {
    ...rest,
    user: user ? { _id: user._id, name: user.name, email: user.email, phone: user.phone } : null,
    payment,
    allowedTransitions: adminTransitions(order.status),
  };
}

export const adminOrderService = {
  detail,

  async list({ page, limit, q, status, paymentStatus, paymentMethod, from, to }) {
    const p = getPagination({ page, limit });
    const filter = {
      ...(status && { status }),
      ...(paymentStatus && { paymentStatus }),
      ...(paymentMethod && { paymentMethod }),
      ...((from || to) && { createdAt: { ...(from && { $gte: from }), ...(to && { $lte: to }) } }),
    };
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' };
      filter.$or = [{ orderNumber: rx }, { 'contact.email': rx }, { 'contact.name': rx }, { 'contact.phone': rx }];
    }
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select('orderNumber status paymentStatus paymentMethod pricing items.name items.image items.quantity contact user createdAt')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(p.skip)
        .limit(p.limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
    const items = orders.map((o) => ({
      ...toOrderSummary(o),
      customer: { name: o.user?.name ?? o.contact?.name, email: o.user?.email ?? o.contact?.email },
    }));
    return { items, pagination: buildPagination({ ...p, total }) };
  },

  async updateStatus(orderId, { status, note, tracking }, actorId) {
    await orderLifecycle.updateStatus({ orderId, status, note, tracking, actorId });
    return detail(orderId);
  },

  async updateTracking(orderId, tracking) {
    const set = Object.fromEntries(
      Object.entries(tracking)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [`tracking.${k}`, v]),
    );
    const order = await Order.findByIdAndUpdate(orderId, { $set: set }, { returnDocument: 'after', runValidators: true });
    if (!order) throw AppError.notFound('Order not found');
    return detail(orderId);
  },

  async cancel(orderId, reason, actorId) {
    await orderLifecycle.cancelOrder({ orderId, by: 'admin', reason, actorId });
    return detail(orderId);
  },

  async resolveReturn(orderId, { action, note }, actorId) {
    if (action === 'approve') await orderReturnService.approve(orderId, note);
    else if (action === 'reject') await orderReturnService.reject(orderId, note);
    else await orderReturnService.complete(orderId, note, actorId);
    return detail(orderId);
  },

  async refund(orderId, { amount, reason }) {
    await refundService.initiateRefund(orderId, { amount, reason: reason || 'Refund issued by the store' });
    return detail(orderId);
  },

  /** Marks a COD order's cash as collected. */
  async markPaid(orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw AppError.notFound('Order not found');
    if (order.paymentMethod !== PAYMENT_METHOD.COD) throw AppError.conflict('Only cash-on-delivery orders can be marked as paid');
    if (order.paymentStatus === PAYMENT_STATUS.PAID) return detail(orderId);
    if ([ORDER_STATUS.CANCELLED, ORDER_STATUS.PENDING].includes(order.status) || order.paymentStatus !== PAYMENT_STATUS.PENDING) {
      throw AppError.conflict('This order cannot be marked as paid');
    }
    const now = new Date();
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, paymentStatus: PAYMENT_STATUS.PENDING },
      { $set: { paymentStatus: PAYMENT_STATUS.PAID, paidAt: now } },
      { returnDocument: 'after' },
    );
    if (updated) {
      await orderLifecycle.recordCapture(order._id, { source: 'system', method: 'cod' });
      await notificationService.orderEvent(updated, 'paid');
    }
    return detail(orderId);
  },

  async setNote(orderId, adminNote) {
    const order = await Order.findByIdAndUpdate(orderId, { $set: { adminNote } }, { returnDocument: 'after' });
    if (!order) throw AppError.notFound('Order not found');
    return detail(orderId);
  },
};
