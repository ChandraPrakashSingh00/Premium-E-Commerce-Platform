import { X } from 'lucide-react';
import { formatPrice } from '@/utils/format';

const eq = (a, b) => a?.toLowerCase() === b?.toLowerCase();

/**
 * Removable chips for every active filter.
 * Props: `shop` (useShopParams result), `facets` (for display names), `hideCategory`, `onClear`.
 */
export function ActiveFilterChips({ shop, facets, hideCategory = false, onClear }) {
  const { filters, setParam, setParams, toggleListValue } = shop;
  const chips = [];

  if (filters.category && !hideCategory) {
    const name = facets?.categories?.find((c) => c.slug === filters.category)?.name ?? filters.category;
    chips.push({ key: 'category', label: name, remove: () => setParam('category', '') });
  }
  filters.brand.forEach((slug) => {
    const name = facets?.brands?.find((b) => eq(b.slug, slug))?.name ?? slug;
    chips.push({ key: `brand-${slug}`, label: name, remove: () => toggleListValue('brand', slug) });
  });
  if (filters.minPrice || filters.maxPrice) {
    const label = filters.minPrice && filters.maxPrice
      ? `${formatPrice(filters.minPrice)} – ${formatPrice(filters.maxPrice)}`
      : filters.minPrice
        ? `Over ${formatPrice(filters.minPrice)}`
        : `Under ${formatPrice(filters.maxPrice)}`;
    chips.push({ key: 'price', label, remove: () => setParams({ minPrice: '', maxPrice: '' }) });
  }
  filters.size.forEach((s) => chips.push({ key: `size-${s}`, label: `Size ${s}`, remove: () => toggleListValue('size', s) }));
  filters.color.forEach((c) => chips.push({ key: `color-${c}`, label: c, remove: () => toggleListValue('color', c) }));
  if (filters.rating) chips.push({ key: 'rating', label: `${filters.rating}★ & up`, remove: () => setParam('rating', '') });
  if (filters.discount) chips.push({ key: 'discount', label: `${filters.discount}%+ off`, remove: () => setParam('discount', '') });
  if (filters.inStock) chips.push({ key: 'inStock', label: 'In stock', remove: () => setParam('inStock', '') });

  if (!chips.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pr-2.5 pl-3.5 text-sm font-medium text-brand-700 transition-colors hover:border-brand-500"
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <X size={14} aria-hidden="true" />
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" onClick={onClear} className="min-h-9 px-2 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline underline-offset-4">
          Clear all
        </button>
      )}
    </div>
  );
}

export default ActiveFilterChips;
