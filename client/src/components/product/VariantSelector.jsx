import { useMemo } from 'react';
import { cn } from '@/utils/cn';
import { imageUrl } from '@/utils/image';
import { LOW_STOCK_THRESHOLD } from '@/features/products/hooks';

const eq = (a, b) => (a ?? '').toLowerCase() === (b ?? '').toLowerCase();

function uniqueBy(list, key) {
  const seen = new Set();
  return list.filter((item) => {
    const k = key(item)?.toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Picks the best variant for a size/colour combination (prefers in-stock). */
function findVariant(variants, { size, color }) {
  const matches = variants.filter((v) => (size === undefined || eq(v.size, size)) && (color === undefined || eq(v.color, color)));
  return matches.find((v) => v.inStock) ?? matches[0];
}

const pill =
  'relative inline-flex h-11 min-w-14 items-center justify-center rounded-lg border px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand-500';

/**
 * Size pills + colour swatches (or plain option pills when variants have neither).
 * Props: `variants`, `selected` (variant), `onSelect(variant)`.
 */
export function VariantSelector({ variants = [], selected, onSelect }) {
  const sizes = useMemo(() => uniqueBy(variants, (v) => v.size).map((v) => v.size), [variants]);
  const colors = useMemo(
    () => uniqueBy(variants, (v) => v.color).map((v) => ({ name: v.color, hex: v.colorHex, image: v.images?.[0]?.url })),
    [variants],
  );

  if (variants.length <= 1) return null;
  const selectedColor = selected?.color;
  const selectedSize = selected?.size;

  const lowStock = selected?.inStock && selected.stock <= LOW_STOCK_THRESHOLD;

  return (
    <div className="space-y-5">
      {colors.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold text-ink-900">
            Color: <span className="font-normal text-ink-600">{selectedColor ?? 'Select'}</span>
          </legend>
          <div className="flex flex-wrap gap-2.5">
            {colors.map((c) => {
              const anyInStock = variants.some((v) => eq(v.color, c.name) && v.inStock);
              const active = eq(c.name, selectedColor);
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${c.name}${anyInStock ? '' : ' (out of stock)'}`}
                  title={c.name}
                  onClick={() => {
                    const next = findVariant(variants, { size: selectedSize, color: c.name }) ?? findVariant(variants, { color: c.name });
                    if (next) onSelect(next);
                  }}
                  className={cn(
                    'relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg border bg-surface transition',
                    active ? 'border-brand-500 ring-2 ring-brand-500 ring-offset-1' : 'border-line hover:border-brand-300',
                  )}
                >
                  {c.image ? (
                    <img src={imageUrl(c.image, 120)} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="h-8 w-8 rounded-full border border-black/10" style={{ backgroundColor: c.hex || '#e5e7eb' }} />
                  )}
                  {!anyInStock && (
                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                      <span className="h-px w-14 rotate-45 bg-ink-500" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {sizes.length > 0 && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold text-ink-900">
            Size: <span className="font-normal text-ink-600">{selectedSize ?? 'Select'}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const variant = findVariant(variants, { size, color: colors.length ? selectedColor : undefined });
              const unavailable = !variant || !variant.inStock;
              const active = eq(size, selectedSize);
              return (
                <button
                  key={size}
                  type="button"
                  disabled={unavailable}
                  aria-pressed={active}
                  aria-label={`Size ${size}${unavailable ? ' (unavailable)' : ''}`}
                  onClick={() => variant && onSelect(variant)}
                  className={cn(
                    pill,
                    active ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-line bg-white text-ink-800 hover:border-brand-400 hover:text-brand-600',
                    unavailable && 'cursor-not-allowed border-dashed bg-surface text-ink-300 line-through hover:border-line hover:text-ink-300',
                  )}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {sizes.length === 0 && colors.length === 0 && (
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold text-ink-900">Option</legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v._id}
                type="button"
                disabled={!v.inStock}
                aria-pressed={v._id === selected?._id}
                onClick={() => onSelect(v)}
                className={cn(
                  pill,
                  v._id === selected?._id ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-line bg-white text-ink-800 hover:border-brand-400 hover:text-brand-600',
                  !v.inStock && 'cursor-not-allowed border-dashed text-ink-300 line-through',
                )}
              >
                {v.title || v.sku}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {lowStock && (
        <p className="flex items-center gap-2 text-sm font-medium text-warning-600" role="status">
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
          Hurry — only {selected.stock} left in this option
        </p>
      )}
    </div>
  );
}

export default VariantSelector;
