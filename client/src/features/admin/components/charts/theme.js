import { formatCompact, formatNumber, formatPrice } from '@/utils/format';

/**
 * Chart tokens (mirrors index.css). Brand blue is the primary series; ink is the
 * neutral comparison series. The categorical order is the validated reference
 * palette with slot 1 swapped for the brand blue (checked with the dataviz validator).
 */
export const CHART = {
  primary: '#086FFD',
  primarySoft: '#D9E8FF',
  ink: '#191B1F',
  secondary: '#9CA3AF',
  grid: '#EEF0F3',
  axis: '#6B7280',
  surface: '#FFFFFF',
  categorical: ['#086FFD', '#EB6834', '#1BAF7A', '#EDA100', '#E87BA4', '#008300', '#4A3AA7', '#E34948'],
};

/** Parses a `YYYY-MM-DD` bucket key as a local date (avoids UTC shifts). */
export const parseBucket = (key) => {
  const [y, m, d] = String(key).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

const FORMATS = {
  day: { day: 'numeric', month: 'short' },
  week: { day: 'numeric', month: 'short' },
  month: { month: 'short', year: '2-digit' },
};

export const formatBucket = (key, granularity = 'day') =>
  new Intl.DateTimeFormat('en-IN', FORMATS[granularity] ?? FORMATS.day).format(parseBucket(key));

export const formatBucketLong = (key, granularity = 'day') => {
  const date = parseBucket(key);
  if (granularity === 'month') return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date);
  const label = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  return granularity === 'week' ? `Week of ${label}` : label;
};

export const moneyTick = (v) => (v === 0 ? '₹0' : `₹${formatCompact(v)}`);
export const countTick = (v) => formatCompact(v);

export const VALUE_FORMATS = {
  money: (v) => formatPrice(v, { precise: !Number.isInteger(Number(v)) }),
  count: (v) => formatNumber(v),
};

export const axisProps = {
  tick: { fill: CHART.axis, fontSize: 12 },
  tickLine: false,
  axisLine: false,
};

/** True when a series has no non-zero values for `keys`. */
export const isEmptySeries = (data, keys) => !data?.length || data.every((row) => keys.every((k) => !Number(row[k])));

/**
 * Order-status groups for the donut. Blue shades = in the pipeline / done, amber = pending,
 * red = cancelled, neutral grey = the returned/refunded tail ("other").
 * Validated with the dataviz palette checker (light surface); contrast relief comes from the
 * always-visible legend with counts and percentages.
 */
export const STATUS_GROUPS = [
  { key: 'delivered', label: 'Delivered', statuses: ['delivered'], color: '#0047B0' },
  { key: 'processing', label: 'Processing', statuses: ['confirmed', 'processing', 'packed'], color: '#086FFD' },
  { key: 'shipped', label: 'Shipped', statuses: ['shipped', 'out_for_delivery'], color: '#74ADFF' },
  { key: 'pending', label: 'Pending', statuses: ['pending'], color: '#E89A00' },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled'], color: '#E34948' },
  { key: 'returned', label: 'Returned', statuses: ['returned', 'refunded'], color: '#9CA3AF', optional: true },
];
