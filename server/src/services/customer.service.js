import mongoose from 'mongoose';
import { ORDER_STATUS, ROLES, USER_STATUS } from '../constants/index.js';
import { Address, Order, User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, roundMoney } from '../utils/helpers.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { orderRevenue } from './analytics.pipelines.js';
import { sessionService } from './session.service.js';

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  name: { name: 1, _id: 1 },
  spent: { totalSpent: -1, createdAt: -1, _id: -1 },
  orders: { orderCount: -1, createdAt: -1, _id: -1 },
};
const NEEDS_STATS_BEFORE_SORT = new Set(['spent', 'orders']);
const RECENT_ORDERS = 5;

const PUBLIC_FIELDS = { name: 1, email: 1, phone: 1, avatar: 1, status: 1, isEmailVerified: 1, createdAt: 1, lastLoginAt: 1 };

const orderStatsStages = [
  {
    $lookup: {
      from: Order.collection.name,
      localField: '_id',
      foreignField: 'user',
      as: 'orderStats',
      pipeline: [
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            totalSpent: { $sum: orderRevenue },
            lastOrderAt: { $max: '$createdAt' },
          },
        },
      ],
    },
  },
  {
    $set: {
      orderCount: { $ifNull: [{ $first: '$orderStats.orderCount' }, 0] },
      totalSpent: { $round: [{ $ifNull: [{ $first: '$orderStats.totalSpent' }, 0] }, 2] },
      lastOrderAt: { $ifNull: [{ $first: '$orderStats.lastOrderAt' }, null] },
    },
  },
  { $project: { orderStats: 0 } },
];

function buildFilter({ q, status }) {
  const filter = { role: ROLES.USER };
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  return filter;
}

export const customerService = {
  async list({ page, limit, q, status, sort = 'newest' }) {
    const p = getPagination({ page, limit });
    const statsFirst = NEEDS_STATS_BEFORE_SORT.has(sort);
    const pageStages = [{ $skip: p.skip }, { $limit: p.limit }];

    // For date/name sorts, only the current page needs the (expensive) order lookup.
    const [result] = await User.aggregate([
      { $match: buildFilter({ q, status }) },
      { $project: PUBLIC_FIELDS },
      ...(statsFirst ? orderStatsStages : []),
      { $sort: SORTS[sort] },
      {
        $facet: {
          items: statsFirst ? pageStages : [...pageStages, ...orderStatsStages],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const total = result.total[0]?.count ?? 0;
    return { items: result.items, pagination: buildPagination({ ...p, total }) };
  },

  async detail(id) {
    const customer = await User.findById(id);
    if (!customer) throw AppError.notFound('Customer not found');
    const userId = new mongoose.Types.ObjectId(String(id));

    const [[stats], recentOrders, addresses] = await Promise.all([
      Order.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            totalSpent: { $sum: orderRevenue },
            revenueOrders: { $sum: { $cond: [{ $gt: [orderRevenue, 0] }, 1, 0] } },
            cancelledCount: { $sum: { $cond: [{ $eq: ['$status', ORDER_STATUS.CANCELLED] }, 1, 0] } },
          },
        },
      ]),
      Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(RECENT_ORDERS)
        .select('orderNumber status paymentStatus paymentMethod pricing createdAt items.name items.image items.quantity')
        .lean(),
      Address.find({ user: userId }).sort({ isDefault: -1, updatedAt: -1 }).lean(),
    ]);

    const totalSpent = roundMoney(stats?.totalSpent ?? 0);
    return {
      customer: customer.toJSON(),
      stats: {
        orderCount: stats?.orderCount ?? 0,
        totalSpent,
        avgOrderValue: stats?.revenueOrders ? roundMoney(totalSpent / stats.revenueOrders) : 0,
        cancelledCount: stats?.cancelledCount ?? 0,
      },
      recentOrders: recentOrders.map(({ items, ...order }) => ({
        ...order,
        itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
        items: items.slice(0, 3),
      })),
      addresses,
    };
  },

  /** Blocking bumps tokenVersion (kills access tokens) and revokes every refresh session. */
  async updateStatus(actorId, id, status) {
    if (String(actorId) === String(id)) throw AppError.badRequest('You cannot change the status of your own account');

    const target = await User.findById(id).select('role status').lean();
    if (!target) throw AppError.notFound('Customer not found');
    if (target.role === ROLES.ADMIN) throw AppError.forbidden('Administrator accounts cannot be modified here');

    const blocking = status === USER_STATUS.BLOCKED;
    const user = await withTransaction(async (session) => {
      const updated = await User.findByIdAndUpdate(
        id,
        { $set: { status }, ...(blocking && { $inc: { tokenVersion: 1 } }) },
        { returnDocument: 'after', session },
      );
      if (blocking) await sessionService.revokeAllForUser(id, { session });
      return updated;
    });
    return user.toJSON();
  },
};
