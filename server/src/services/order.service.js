import { CUSTOMER_CANCELLABLE, ORDER_STATUS } from '../constants/index.js';
import { Order } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { isPayable } from './checkout.service.js';
import { orderLifecycle } from './orderLifecycle.service.js';
import { isWithinReturnWindow, orderReturnService } from './orderReturn.service.js';
import { settingsService } from './settings.service.js';

const INTERNAL_FIELDS = ['idempotencyKey', 'adminNote', 'notificationsSent', '__v'];

const toPlain = (order) => (typeof order?.toJSON === 'function' ? order.toJSON() : { ...order });

/** Summary shape used by order lists. */
export function toOrderSummary(order) {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    pricing: order.pricing,
    itemCount: (order.items ?? []).reduce((s, i) => s + i.quantity, 0),
    items: (order.items ?? []).slice(0, 3).map((i) => ({ name: i.name, image: i.image, quantity: i.quantity })),
    createdAt: order.createdAt,
  };
}

/** Customer-facing Order with computed permissions. */
export async function toCustomerOrder(order) {
  const { returnWindowDays } = await settingsService.get();
  const plain = toPlain(order);
  for (const key of INTERNAL_FIELDS) delete plain[key];
  if (plain.coupon) plain.coupon = plain.coupon.code ? { code: plain.coupon.code } : undefined;
  plain.statusHistory = (plain.statusHistory ?? []).map(({ status, note, at }) => ({ status, note, at }));
  return {
    ...plain,
    canCancel: CUSTOMER_CANCELLABLE.includes(order.status),
    canReturn:
      order.status === ORDER_STATUS.DELIVERED && !order.returnRequest?.status && isWithinReturnWindow(order, returnWindowDays),
    canRetryPayment: isPayable(order),
  };
}

export const orderService = {
  async list(userId, { page, limit, status }) {
    const p = getPagination({ page, limit });
    const filter = { user: userId, ...(status && { status }) };
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .select('orderNumber status paymentStatus paymentMethod pricing items.name items.image items.quantity createdAt')
        .sort({ createdAt: -1 })
        .skip(p.skip)
        .limit(p.limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
    return { items: orders.map(toOrderSummary), pagination: buildPagination({ ...p, total }) };
  },

  async getById(userId, orderId) {
    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) throw AppError.notFound('Order not found');
    return toCustomerOrder(order);
  },

  async cancel(userId, orderId, reason) {
    const order = await orderLifecycle.cancelOrder({ orderId, by: 'customer', reason, userId });
    return toCustomerOrder(order);
  },

  async requestReturn(userId, orderId, body) {
    return toCustomerOrder(await orderReturnService.request(userId, orderId, body));
  },
};
