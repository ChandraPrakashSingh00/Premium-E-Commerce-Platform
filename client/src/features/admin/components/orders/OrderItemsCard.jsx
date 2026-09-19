import { Link } from 'react-router';
import { SmartImage } from '@/components/ui';
import { formatPrice, pluralize } from '@/utils/format';
import { SectionCard } from './SectionCard';

function Row({ label, value, strong, muted }) {
  return (
    <div className={strong ? 'flex justify-between gap-4 pt-3 text-base font-semibold text-ink-900' : 'flex justify-between gap-4 text-sm'}>
      <dt className={strong ? undefined : 'text-ink-500'}>{label}</dt>
      <dd className={strong ? 'tabular-nums' : muted ? 'text-ink-500 tabular-nums' : 'font-medium text-ink-900 tabular-nums'}>{value}</dd>
    </div>
  );
}

/** Pricing breakdown (all amounts are rupees). */
export function PricingSummary({ pricing = {}, coupon }) {
  return (
    <dl className="space-y-2">
      <Row label="Subtotal" value={formatPrice(pricing.subtotal)} />
      {pricing.discount > 0 && <Row label="Savings (vs MRP)" value={formatPrice(pricing.discount)} muted />}
      {pricing.couponDiscount > 0 && (
        <Row
          label={
            <>
              Coupon{coupon?.code && <span className="ml-1.5 rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs text-ink-700">{coupon.code}</span>}
            </>
          }
          value={`−${formatPrice(pricing.couponDiscount)}`}
        />
      )}
      <Row label="Tax" value={formatPrice(pricing.tax)} />
      <Row label="Shipping" value={pricing.shipping > 0 ? formatPrice(pricing.shipping) : 'Free'} />
      {pricing.codFee > 0 && <Row label="COD fee" value={formatPrice(pricing.codFee)} />}
      <div className="border-t border-line">
        <Row label="Total" value={formatPrice(pricing.total)} strong />
      </div>
    </dl>
  );
}

/** Line items with pricing summary. */
export function OrderItemsCard({ order }) {
  const items = order.items ?? [];
  const units = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  return (
    <SectionCard title="Items" description={`${pluralize(items.length, 'product')} · ${pluralize(units, 'unit')}`} flush>
      <ul className="divide-y divide-line">
        {items.map((item) => {
          const variant = [item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ');
          return (
            <li key={item._id ?? `${item.product}-${item.variant}`} className="flex gap-4 px-5 py-4">
              <SmartImage src={item.image} alt="" width={120} className="h-16 w-16 shrink-0 rounded-lg border border-line" />
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  {item.slug ? (
                    <Link to={`/product/${item.slug}`} target="_blank" rel="noreferrer" className="line-clamp-2 text-sm font-medium text-ink-900 hover:text-brand-600">
                      {item.name}
                    </Link>
                  ) : (
                    <p className="line-clamp-2 text-sm font-medium text-ink-900">{item.name}</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-500">
                    {[item.brandName, variant].filter(Boolean).join(' · ')}
                  </p>
                  {item.sku && <p className="mt-0.5 font-mono text-xs text-ink-400">SKU {item.sku}</p>}
                </div>
                <div className="flex items-baseline justify-between gap-4 sm:block sm:text-right">
                  <p className="text-xs text-ink-500 tabular-nums">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                  <p className="text-sm font-semibold text-ink-900 tabular-nums">{formatPrice(item.lineTotal ?? item.lineSubtotal)}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-line bg-surface/40 px-5 py-4 sm:pl-[calc(50%)]">
        <PricingSummary pricing={order.pricing} coupon={order.coupon} />
      </div>
    </SectionCard>
  );
}
