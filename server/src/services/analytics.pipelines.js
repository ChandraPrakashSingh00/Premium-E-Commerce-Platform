/**
 * Shared date-bucketing helpers and aggregation fragments for admin analytics.
 * All buckets are computed in IST (UTC+05:30, no DST) and keyed as YYYY-MM-DD
 * (the first day of the bucket).
 */
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/index.js';
import { Brand, Category, Product } from '../models/index.js';

export const TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 330 * 60 * 1000;

const istParts = (date) => {
  const d = new Date(date.getTime() + IST_OFFSET_MS);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay() };
};
const istDate = (y, m, d) => new Date(Date.UTC(y, m, d) - IST_OFFSET_MS);
const pad = (n) => String(n).padStart(2, '0');

export const formatIstDate = (date) => {
  const p = istParts(date);
  return `${p.y}-${pad(p.m + 1)}-${pad(p.d)}`;
};

/** Start (as a UTC instant) of the IST day/week(Monday)/month containing `date`. */
export const bucketStart = (date, unit) => {
  const p = istParts(date);
  if (unit === 'month') return istDate(p.y, p.m, 1);
  if (unit === 'week') return istDate(p.y, p.m, p.d - ((p.dow + 6) % 7));
  return istDate(p.y, p.m, p.d);
};

export const addUnits = (date, unit, n) => {
  const p = istParts(date);
  if (unit === 'month') return istDate(p.y, p.m + n, p.d);
  return istDate(p.y, p.m, p.d + n * (unit === 'week' ? 7 : 1));
};

/** Every bucket key in [from, to). */
export function bucketKeys(from, to, unit) {
  const keys = [];
  for (let t = bucketStart(from, unit); t < to; t = addUnits(t, unit, 1)) keys.push(formatIstDate(t));
  return keys;
}

/** Zero-fills an aggregated `[{ _id: key, ...values }]` array over the given keys. */
export function fillSeries(keys, rows, fields) {
  const byKey = new Map(rows.map((r) => [r._id, r]));
  return keys.map((date) => {
    const row = byKey.get(date);
    return fields.reduce((acc, f) => ({ ...acc, [f]: roundTo2(row?.[f] ?? 0) }), { date });
  });
}

export const roundTo2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const bucketExpr = (unit, field = '$createdAt') => ({
  $dateToString: {
    format: '%Y-%m-%d',
    timezone: TIMEZONE,
    date: { $dateTrunc: { date: field, unit, timezone: TIMEZONE, ...(unit === 'week' && { startOfWeek: 'monday' }) } },
  },
});

/** % change vs previous period; null when there is no baseline. */
export const percentChange = (current, previous) =>
  previous ? Math.round(((current - previous) / previous) * 1000) / 10 : null;

/**
 * An order counts as revenue when it is not cancelled/refunded and it was paid
 * (online or COD collected), or it is a delivered COD order still awaiting reconciliation.
 */
export const isRevenueOrder = {
  $and: [
    { $not: [{ $in: ['$status', [ORDER_STATUS.CANCELLED, ORDER_STATUS.REFUNDED]] }] },
    {
      $or: [
        { $in: ['$paymentStatus', [PAYMENT_STATUS.PAID, PAYMENT_STATUS.PARTIALLY_REFUNDED]] },
        {
          $and: [
            { $eq: ['$paymentMethod', PAYMENT_METHOD.COD] },
            { $eq: ['$status', ORDER_STATUS.DELIVERED] },
            { $eq: ['$paymentStatus', PAYMENT_STATUS.PENDING] },
          ],
        },
      ],
    },
  ],
};

/** Order total net of partial refunds, 0 for non-revenue orders. */
export const orderRevenue = {
  $cond: [
    isRevenueOrder,
    {
      $subtract: [
        '$pricing.total',
        { $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUS.PARTIALLY_REFUNDED] }, { $ifNull: ['$refund.amount', 0] }, 0] },
      ],
    },
    0,
  ],
};

const soldItemsByProduct = [
  { $match: { $expr: isRevenueOrder } },
  { $unwind: '$items' },
  {
    $group: {
      _id: '$items.product',
      name: { $first: '$items.name' },
      image: { $first: '$items.image' },
      quantity: { $sum: '$items.quantity' },
      revenue: { $sum: '$items.lineTotal' },
    },
  },
];

const byRevenue = { $sort: { revenue: -1, quantity: -1, _id: 1 } };

export const topProductsStages = (limit) => [
  ...soldItemsByProduct,
  byRevenue,
  { $limit: limit },
  {
    $lookup: {
      from: Product.collection.name,
      localField: '_id',
      foreignField: '_id',
      as: 'product',
      pipeline: [{ $project: { name: 1, thumbnail: 1 } }],
    },
  },
  {
    $project: {
      _id: 0,
      productId: '$_id',
      name: { $ifNull: [{ $first: '$product.name' }, '$name'] },
      thumbnail: { $ifNull: [{ $first: '$product.thumbnail' }, '$image'] },
      quantity: 1,
      revenue: { $round: ['$revenue', 2] },
    },
  },
];

const REF_TARGETS = {
  category: { collection: () => Category.collection.name, idField: 'categoryId' },
  brand: { collection: () => Brand.collection.name, idField: 'brandId' },
};

/** Sales grouped by a product reference (category / brand) in a single pipeline. */
export const topByProductRefStages = (ref, limit) => {
  const { collection, idField } = REF_TARGETS[ref];
  return [
    ...soldItemsByProduct,
    {
      $lookup: {
        from: Product.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'product',
        pipeline: [{ $project: { [ref]: 1 } }],
      },
    },
    { $unwind: '$product' },
    { $group: { _id: `$product.${ref}`, quantity: { $sum: '$quantity' }, revenue: { $sum: '$revenue' } } },
    byRevenue,
    { $limit: limit },
    { $lookup: { from: collection(), localField: '_id', foreignField: '_id', as: 'ref', pipeline: [{ $project: { name: 1 } }] } },
    {
      $project: {
        _id: 0,
        [idField]: '$_id',
        name: { $ifNull: [{ $first: '$ref.name' }, 'Unknown'] },
        quantity: 1,
        revenue: { $round: ['$revenue', 2] },
      },
    },
  ];
};
