import { ORDER_STATUS, ROLES } from '../constants/index.js';
import { Inventory, Order, Product, User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import {
  addUnits,
  bucketExpr,
  bucketKeys,
  bucketStart,
  fillSeries,
  isRevenueOrder,
  orderRevenue,
  percentChange,
  roundTo2,
  topByProductRefStages,
  topProductsStages,
} from './analytics.pipelines.js';

const RANGES = {
  '7d': { unit: 'day', count: 7 },
  '30d': { unit: 'day', count: 30 },
  '90d': { unit: 'day', count: 90 },
  '12m': { unit: 'month', count: 12 },
};
const MAX_BUCKETS = { day: 366, week: 260, month: 120 };
const DEFAULT_ANALYTICS_DAYS = 30;
const RECENT_ORDERS = 8;
const DASHBOARD_TOP = 5;
const ANALYTICS_TOP = 10;

/** Current window [from, to) aligned to IST buckets, plus an equally long previous window. */
function resolveRange(range, now = new Date()) {
  const { unit, count } = RANGES[range];
  const from = addUnits(bucketStart(now, unit), unit, -(count - 1));
  const prevFrom = new Date(from.getTime() - (now.getTime() - from.getTime()));
  return { unit, from, to: now, prevFrom };
}

const inRange = (from, to) => ({ createdAt: { $gte: from, $lt: to } });

const newCustomersByBucket = (from, to, unit) =>
  User.aggregate([
    { $match: { role: ROLES.USER, ...inRange(from, to) } },
    { $group: { _id: bucketExpr(unit), customers: { $sum: 1 } } },
  ]);

function recentOrders(limit) {
  return Order.aggregate([
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: User.collection.name,
        localField: 'user',
        foreignField: '_id',
        as: 'customer',
        pipeline: [{ $project: { _id: 1, name: 1, email: 1 } }],
      },
    },
    {
      $project: {
        orderNumber: 1,
        status: 1,
        paymentStatus: 1,
        paymentMethod: 1,
        pricing: 1,
        itemCount: { $sum: '$items.quantity' },
        createdAt: 1,
        customer: { $ifNull: [{ $first: '$customer' }, { name: '$contact.name', email: '$contact.email' }] },
      },
    },
  ]);
}

export const analyticsService = {
  async dashboard({ range = '30d' } = {}) {
    const { unit, from, to, prevFrom } = resolveRange(range);
    const current = { $match: { createdAt: { $gte: from } } };

    const [[orderStats], [customerStats], seriesCustomers, totalCustomers, productCounts, lowStock, pendingOrders, recent] =
      await Promise.all([
        Order.aggregate([
          { $match: inRange(prevFrom, to) },
          {
            $facet: {
              totals: [
                {
                  $group: {
                    _id: { $cond: [{ $gte: ['$createdAt', from] }, 'current', 'previous'] },
                    orders: { $sum: 1 },
                    revenue: { $sum: orderRevenue },
                  },
                },
              ],
              series: [current, { $group: { _id: bucketExpr(unit), revenue: { $sum: orderRevenue }, orders: { $sum: 1 } } }],
              statusBreakdown: [
                current,
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } },
                { $project: { _id: 0, status: '$_id', count: 1 } },
              ],
              topProducts: [current, ...topProductsStages(DASHBOARD_TOP)],
              topCategories: [current, ...topByProductRefStages('category', DASHBOARD_TOP)],
            },
          },
        ]),
        User.aggregate([
          { $match: { role: ROLES.USER, ...inRange(prevFrom, to) } },
          {
            $group: {
              _id: null,
              current: { $sum: { $cond: [{ $gte: ['$createdAt', from] }, 1, 0] } },
              previous: { $sum: { $cond: [{ $lt: ['$createdAt', from] }, 1, 0] } },
            },
          },
        ]),
        newCustomersByBucket(from, to, unit),
        User.countDocuments({ role: ROLES.USER }),
        Product.aggregate([{ $group: { _id: null, total: { $sum: 1 }, published: { $sum: { $cond: ['$isPublished', 1, 0] } } } }]),
        Inventory.countDocuments({ $expr: { $lte: ['$available', '$lowStockThreshold'] } }),
        Order.countDocuments({ status: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED] } }),
        recentOrders(RECENT_ORDERS),
      ]);

    const totals = Object.fromEntries(orderStats.totals.map((t) => [t._id, t]));
    const cur = { revenue: roundTo2(totals.current?.revenue ?? 0), orders: totals.current?.orders ?? 0 };
    const prev = { revenue: roundTo2(totals.previous?.revenue ?? 0), orders: totals.previous?.orders ?? 0 };
    const newCustomers = customerStats?.current ?? 0;
    const keys = bucketKeys(from, to, unit);

    return {
      range,
      period: { from, to, previousFrom: prevFrom, granularity: unit },
      cards: {
        revenue: { value: cur.revenue, previous: prev.revenue, change: percentChange(cur.revenue, prev.revenue) },
        orders: { value: cur.orders, previous: prev.orders, change: percentChange(cur.orders, prev.orders) },
        customers: {
          value: newCustomers,
          total: totalCustomers,
          previous: customerStats?.previous ?? 0,
          change: percentChange(newCustomers, customerStats?.previous ?? 0),
        },
        products: { value: productCounts[0]?.total ?? 0, published: productCounts[0]?.published ?? 0, change: null },
        lowStock: { value: lowStock, change: null },
        pendingOrders: { value: pendingOrders, change: null },
      },
      revenueSeries: fillSeries(keys, orderStats.series, ['revenue', 'orders']),
      customerSeries: fillSeries(keys, seriesCustomers, ['customers']),
      orderStatusBreakdown: orderStats.statusBreakdown,
      topProducts: orderStats.topProducts,
      topCategories: orderStats.topCategories,
      recentOrders: recent,
    };
  },

  /** `to` is inclusive of the whole IST day. */
  async analytics({ from, to, granularity = 'day' } = {}) {
    const now = new Date();
    const end = addUnits(bucketStart(to ?? now, 'day'), 'day', 1);
    const start = bucketStart(from ?? addUnits(end, 'day', -DEFAULT_ANALYTICS_DAYS), 'day');
    if (start >= end) throw AppError.badRequest('"from" must be before "to"');

    const keys = bucketKeys(start, end, granularity);
    if (keys.length > MAX_BUCKETS[granularity]) {
      throw AppError.badRequest(`Range too large for ${granularity} granularity – choose a coarser granularity`);
    }

    const [[stats], customerRows] = await Promise.all([
      Order.aggregate([
        { $match: inRange(start, end) },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  orders: { $sum: 1 },
                  revenueOrders: { $sum: { $cond: [isRevenueOrder, 1, 0] } },
                  revenue: { $sum: orderRevenue },
                  refunded: { $sum: { $cond: [{ $eq: ['$refund.status', 'processed'] }, { $ifNull: ['$refund.amount', 0] }, 0] } },
                  itemsSold: { $sum: { $cond: [isRevenueOrder, { $sum: '$items.quantity' }, 0] } },
                },
              },
            ],
            series: [{ $group: { _id: bucketExpr(granularity), revenue: { $sum: orderRevenue }, orders: { $sum: 1 } } }],
            paymentMethods: [
              { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: orderRevenue } } },
              { $sort: { count: -1, _id: 1 } },
              { $project: { _id: 0, method: '$_id', count: 1, revenue: { $round: ['$revenue', 2] } } },
            ],
            topProducts: topProductsStages(ANALYTICS_TOP),
            topCategories: topByProductRefStages('category', ANALYTICS_TOP),
            topBrands: topByProductRefStages('brand', ANALYTICS_TOP),
          },
        },
      ]),
      newCustomersByBucket(start, end, granularity),
    ]);

    const s = stats.summary[0] ?? {};
    const revenue = roundTo2(s.revenue ?? 0);
    const customersByKey = new Map(customerRows.map((r) => [r._id, r.customers]));
    const orderSeries = fillSeries(keys, stats.series, ['revenue', 'orders']);

    return {
      period: { from: start, to: end, granularity },
      summary: {
        revenue,
        orders: s.orders ?? 0,
        avgOrderValue: s.revenueOrders ? roundTo2(revenue / s.revenueOrders) : 0,
        newCustomers: customerRows.reduce((sum, r) => sum + r.customers, 0),
        refunded: roundTo2(s.refunded ?? 0),
        itemsSold: s.itemsSold ?? 0,
      },
      series: orderSeries.map((row) => ({ ...row, customers: customersByKey.get(row.date) ?? 0 })),
      paymentMethods: stats.paymentMethods,
      topProducts: stats.topProducts,
      topCategories: stats.topCategories,
      topBrands: stats.topBrands,
    };
  },
};
