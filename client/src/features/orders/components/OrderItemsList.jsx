import { CheckCircle2, PenLine } from 'lucide-react';
import { Link } from 'react-router';
import { Button, SmartImage } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

const variantText = (item) => [item.size && `Size ${item.size}`, item.color].filter(Boolean).join(' · ');

/**
 * Line items of an order (or a cart/quote – `lineTotal` falls back to `lineSubtotal`).
 * `onReview(item)` shows a "Write a review" action for reviewable items.
 */
export function OrderItemsList({ items, canReview = false, onReview, compact = false, className }) {
  return (
    <ul className={cn('divide-y divide-line', className)}>
      {items.map((item) => {
        const total = item.lineTotal ?? item.lineSubtotal ?? item.price * item.quantity;
        const variant = variantText(item);
        return (
          <li key={item._id ?? item.variantId} className={cn('flex gap-4', compact ? 'py-3' : 'py-5')}>
            <Link
              to={item.slug ? `/product/${item.slug}` : '#'}
              className={cn('shrink-0 overflow-hidden rounded-lg border border-line bg-surface', compact ? 'h-14 w-14' : 'h-20 w-20 sm:h-24 sm:w-24')}
              tabIndex={-1}
              aria-hidden="true"
            >
              <SmartImage src={item.image} alt="" width={200} className="h-full w-full" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {item.brandName && !compact && <p className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase">{item.brandName}</p>}
                  {item.slug ? (
                    <Link to={`/product/${item.slug}`} className={cn('line-clamp-2 font-medium text-ink-900 hover:text-brand-600', compact ? 'text-sm' : 'text-sm sm:text-base')}>
                      {item.name}
                    </Link>
                  ) : (
                    <p className="line-clamp-2 text-sm font-medium text-ink-900">{item.name}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-500">
                    {variant && <span>{variant} · </span>}
                    Qty {item.quantity}
                    {!compact && <span> · {formatPrice(item.price)} each</span>}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-ink-900 tabular-nums">{formatPrice(total)}</p>
              </div>
              {canReview && !compact && (
                <div className="mt-auto pt-3">
                  {item.isReviewed ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-600">
                      <CheckCircle2 size={14} aria-hidden="true" /> Reviewed
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" leftIcon={<PenLine size={14} />} onClick={() => onReview?.(item)}>
                      Write a Review
                    </Button>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
