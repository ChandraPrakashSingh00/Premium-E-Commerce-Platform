import { memo } from 'react';
import { Link } from 'react-router';
import { AlertCircle, Trash2 } from 'lucide-react';
import { QuantityStepper, SmartImage } from '@/components/ui';
import { MAX_QTY_PER_ITEM } from '@/constants';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

const ISSUE_MESSAGES = {
  unavailable: () => 'This item is no longer available. Please remove it to continue.',
  out_of_stock: () => 'Out of stock. Please remove it to continue.',
  insufficient_stock: (item) => `Only ${item.stock} left. Please reduce the quantity.`,
  price_changed: () => 'The price of this item has changed since you added it.',
};

function RemoveButton({ item, onRemove, disabled }) {
  return (
    <button
      type="button"
      onClick={() => onRemove(item._id)}
      disabled={disabled}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
      aria-label={`Remove ${item.name} from cart`}
      title="Remove"
    >
      <Trash2 size={17} aria-hidden="true" />
    </button>
  );
}

function UnitPrice({ item, className }) {
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-1.5 text-sm', className)}>
      <span className="font-semibold text-ink-900">{formatPrice(item.price)}</span>
      {item.compareAtPrice > item.price && (
        <span className="text-xs text-ink-400 line-through">
          <span className="sr-only">Original price </span>
          {formatPrice(item.compareAtPrice)}
        </span>
      )}
    </p>
  );
}

/**
 * Single cart line (drawer + cart page).
 * Props: `item` (CartView item), `onQuantity(id, qty)`, `onRemove(id)`, `disabled`, `size` ('sm' | 'md').
 * `md` renders a table-like row on ≥ sm screens (product · price · quantity · total · remove).
 */
function CartLineItemBase({ item, onQuantity, onRemove, disabled, size = 'md' }) {
  const blocked = item.issue === 'unavailable' || item.issue === 'out_of_stock';
  const max = Math.max(1, Math.min(MAX_QTY_PER_ITEM, item.maxQuantity ?? item.stock ?? MAX_QTY_PER_ITEM));
  const variantText = [item.color, item.size && `Size ${item.size}`].filter(Boolean).join(' · ');
  const compact = size === 'sm';
  const issue = item.issue && ISSUE_MESSAGES[item.issue]?.(item);

  const stepper = blocked ? (
    <span className="inline-flex h-9 items-center rounded-lg bg-ink-100 px-3 text-xs font-semibold text-ink-500">Unavailable</span>
  ) : (
    <QuantityStepper size="sm" value={item.quantity} max={max} disabled={disabled} onChange={(q) => onQuantity(item._id, q)} label={`Quantity for ${item.name}`} />
  );

  return (
    <article className={cn('relative flex gap-3 sm:gap-4', compact ? 'py-4' : 'py-4 sm:py-5')}>
      <Link to={`/product/${item.slug}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <SmartImage
          src={item.image}
          alt=""
          width={240}
          sizes={compact ? '80px' : '96px'}
          aspect="1 / 1"
          className={cn('rounded-lg border border-line', compact ? 'w-20' : 'w-20 sm:w-24', blocked && 'opacity-50')}
        />
      </Link>

      <div className={cn('flex min-w-0 flex-1 flex-col', !compact && 'sm:flex-row sm:items-center sm:gap-4')}>
        <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
          <div className="min-w-0">
            {item.brandName && <p className="text-[11px] font-semibold tracking-wider text-ink-400 uppercase">{item.brandName}</p>}
            <h3 className="mt-0.5 line-clamp-2 text-sm leading-snug font-medium text-ink-900">
              <Link to={`/product/${item.slug}`} className="hover:text-brand-600">
                {item.name}
              </Link>
            </h3>
            {variantText && <p className="mt-1 text-xs text-ink-500">{variantText}</p>}
            <UnitPrice item={item} className={cn('mt-1', !compact && 'sm:hidden')} />
            {!compact && item.quantity > 1 && (
              <p className="mt-0.5 text-xs text-ink-500 sm:hidden">
                Total: <span className="font-bold text-ink-900 tabular-nums">{formatPrice(item.lineSubtotal)}</span>
              </p>
            )}
            {!compact && item.sku && <p className="mt-0.5 hidden text-xs text-ink-400 sm:block">SKU: {item.sku}</p>}
            {issue && (
              <p className={cn('mt-2 flex items-start gap-1.5 text-xs font-medium', item.issue === 'price_changed' ? 'text-warning-600' : 'text-danger-600')} role="status">
                <AlertCircle size={14} className="mt-px shrink-0" aria-hidden="true" />
                {issue}
              </p>
            )}
          </div>
          {compact && <p className="shrink-0 text-sm font-bold text-ink-900 tabular-nums">{formatPrice(item.lineSubtotal)}</p>}
        </div>

        {!compact && (
          <>
            <UnitPrice item={item} className="hidden w-24 shrink-0 flex-col items-end sm:flex lg:w-28" />
            <div className="hidden w-28 shrink-0 justify-center sm:flex">{stepper}</div>
            <p className="hidden w-24 shrink-0 text-right text-sm font-bold text-ink-900 tabular-nums sm:block">{formatPrice(item.lineSubtotal)}</p>
            <div className="hidden sm:block">
              <RemoveButton item={item} onRemove={onRemove} disabled={disabled} />
            </div>
          </>
        )}

        {/* Mobile / compact controls */}
        <div className={cn('mt-auto flex items-center justify-between gap-2 pt-3', !compact && 'sm:hidden')}>
          {stepper}
          <RemoveButton item={item} onRemove={onRemove} disabled={disabled} />
        </div>
      </div>
    </article>
  );
}

export const CartLineItem = memo(CartLineItemBase);
export default CartLineItem;
