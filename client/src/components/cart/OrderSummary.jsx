import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

function Row({ label, value, tone, strong }) {
  return (
    <div className={cn('flex items-center justify-between gap-4', strong ? 'text-base font-bold text-ink-900' : 'text-sm text-ink-600')}>
      <dt className="min-w-0">{label}</dt>
      <dd className={cn('shrink-0 tabular-nums', tone === 'success' ? 'font-semibold text-success-600' : !strong && 'font-medium text-ink-900', strong && 'font-display text-xl')}>
        {value}
      </dd>
    </div>
  );
}

/**
 * Server-calculated totals (never computed on the client).
 * `summary.subtotal` is at selling price and `summary.discount` is the saving on MRP, so the
 * MRP line is shown as subtotal + discount followed by the discount — the rows always reconcile
 * with the server `total`.
 * Props: `summary` (CartView.summary), `coupon`, `className`.
 */
export function OrderSummary({ summary, coupon, className }) {
  if (!summary) return null;
  const mrpDiscount = summary.discount || 0;
  const savings = mrpDiscount + (summary.couponDiscount || 0);
  const items = `${summary.itemCount} ${summary.itemCount === 1 ? 'item' : 'items'}`;
  return (
    <div className={className}>
      <dl className="space-y-3">
        <Row label={`Subtotal (${items})`} value={formatPrice(summary.subtotal + mrpDiscount)} />
        {mrpDiscount > 0 && <Row label="Discount" value={`−${formatPrice(mrpDiscount)}`} tone="success" />}
        {summary.couponDiscount > 0 && (
          <Row label={`Coupon${coupon?.code ? ` (${coupon.code})` : ''}`} value={`−${formatPrice(summary.couponDiscount)}`} tone="success" />
        )}
        <Row label="Shipping" value={summary.shipping > 0 ? formatPrice(summary.shipping) : 'Free'} tone={summary.shipping > 0 ? undefined : 'success'} />
        <Row label="Tax" value={formatPrice(summary.tax)} />
        {summary.codFee > 0 && <Row label="COD fee" value={formatPrice(summary.codFee)} />}
        <div className="border-t border-dashed border-line pt-4">
          <Row label="Total" value={formatPrice(summary.total)} strong />
        </div>
      </dl>
      {savings > 0 && (
        <p className="mt-4 rounded-lg bg-success-50 px-3 py-2 text-center text-sm font-semibold text-success-600">
          You’re saving {formatPrice(savings)} on this order
        </p>
      )}
    </div>
  );
}

export default OrderSummary;
