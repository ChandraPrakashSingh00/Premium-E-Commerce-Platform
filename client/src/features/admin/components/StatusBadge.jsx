import { Badge } from '@/components/ui';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONE } from '@/constants';
import { titleCase } from '@/utils/format';

const MAPS = {
  order: { labels: ORDER_STATUS_LABELS, tones: ORDER_STATUS_TONE },
  payment: { labels: PAYMENT_STATUS_LABELS, tones: PAYMENT_STATUS_TONE },
  paymentRecord: {
    labels: { created: 'Created', authorized: 'Authorized', captured: 'Captured', failed: 'Failed', cancelled: 'Cancelled', refunded: 'Refunded', partially_refunded: 'Partially Refunded' },
    tones: { created: 'neutral', authorized: 'brand', captured: 'success', failed: 'danger', cancelled: 'neutral', refunded: 'neutral', partially_refunded: 'warning' },
  },
  stock: {
    labels: { in: 'In stock', low: 'Low stock', out: 'Out of stock' },
    tones: { in: 'success', low: 'warning', out: 'danger' },
  },
  review: {
    labels: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
    tones: { pending: 'warning', approved: 'success', rejected: 'danger' },
  },
  coupon: {
    labels: { active: 'Active', inactive: 'Inactive', expired: 'Expired', scheduled: 'Scheduled', exhausted: 'Used up' },
    tones: { active: 'success', inactive: 'neutral', expired: 'danger', scheduled: 'brand', exhausted: 'warning' },
  },
  customer: { labels: { active: 'Active', blocked: 'Blocked' }, tones: { active: 'success', blocked: 'danger' } },
  publish: { labels: { published: 'Published', draft: 'Draft' }, tones: { published: 'success', draft: 'neutral' } },
  message: { labels: { new: 'New', read: 'Read', resolved: 'Resolved' }, tones: { new: 'brand', read: 'neutral', resolved: 'success' } },
  return: {
    labels: { requested: 'Return requested', approved: 'Return approved', rejected: 'Return rejected', completed: 'Return completed' },
    tones: { requested: 'warning', approved: 'brand', rejected: 'danger', completed: 'success' },
  },
  refund: {
    labels: { none: 'No refund', pending: 'Refund pending', processed: 'Refunded', failed: 'Refund failed' },
    tones: { none: 'neutral', pending: 'warning', processed: 'success', failed: 'danger' },
  },
};

/** Status pill with a text label (never colour alone). */
export function StatusBadge({ type = 'order', value, className, dot = true }) {
  if (!value) return null;
  const map = MAPS[type] ?? {};
  return (
    <Badge tone={map.tones?.[value] ?? 'neutral'} dot={dot} className={className}>
      {map.labels?.[value] ?? titleCase(value)}
    </Badge>
  );
}
