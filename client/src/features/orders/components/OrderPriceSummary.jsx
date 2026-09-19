import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

function Row({ label, value, tone, strong }) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', strong ? 'text-base font-bold text-ink-900' : 'text-sm')}>
      <dt className={cn('min-w-0', !strong && 'text-ink-600')}>{label}</dt>
      <dd
        className={cn(
          'shrink-0 tabular-nums',
          tone === 'success' && 'font-semibold text-success-600',
          !strong && !tone && 'font-medium text-ink-900',
          strong && 'font-display text-xl',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Server-calculated totals. Accepts an order `pricing` object or a cart/quote `summary`
 * (same field names). `subtotal` is at selling price and `discount` is the saving on MRP, so the
 * first row shows the MRP value (subtotal + discount) followed by the discount; rows always add up
 * to the server `total`. Never computes the total on the client.
 */
export function OrderPriceSummary({ pricing, couponCode, itemCount, className, totalLabel = 'Total' }) {
  if (!pricing) return null;
  const mrpDiscount = pricing.discount || 0;
  return (
    <dl className={cn('space-y-3', className)}>
      <Row label={itemCount ? `Subtotal (${itemCount} ${itemCount === 1 ? 'item' : 'items'})` : 'Subtotal'} value={formatPrice(pricing.subtotal + mrpDiscount)} />
      {mrpDiscount > 0 && <Row label="Discount" value={`−${formatPrice(mrpDiscount)}`} tone="success" />}
      {pricing.couponDiscount > 0 && (
        <Row label={couponCode ? `Coupon (${couponCode})` : 'Coupon discount'} value={`−${formatPrice(pricing.couponDiscount)}`} tone="success" />
      )}
      <Row label="Shipping" value={pricing.shipping > 0 ? formatPrice(pricing.shipping) : 'Free'} tone={pricing.shipping > 0 ? undefined : 'success'} />
      <Row label="Tax (GST)" value={formatPrice(pricing.tax || 0)} />
      {pricing.codFee > 0 && <Row label="Cash on delivery fee" value={formatPrice(pricing.codFee)} />}
      <div className="border-t border-dashed border-line pt-3">
        <Row label={totalLabel} value={formatPrice(pricing.total)} strong />
      </div>
    </dl>
  );
}
