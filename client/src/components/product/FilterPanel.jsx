import { Check, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/utils/cn';
import { chipClass } from './filters/chipClass';
import { FilterSection } from './filters/FilterSection';
import { CheckList, OptionRow } from './filters/OptionRow';
import { PriceFilter } from './filters/PriceFilter';

const RATINGS = [4, 3, 2];
const DISCOUNTS = [10, 20, 30, 50];

const eq = (a, b) => a.toLowerCase() === b.toLowerCase();

function PanelSkeleton() {
  return (
    <div className="space-y-6 py-3" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

function Stars({ value }) {
  return (
    <span className="flex items-center gap-1">
      {value}
      <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
      <span>&amp; up</span>
    </span>
  );
}

function ColorSwatches({ colors, selected, onToggle }) {
  return (
    <ul className="flex flex-wrap gap-1" role="group" aria-label="Colour">
      {colors.map((c) => {
        const active = selected.some((v) => eq(v, c.name));
        return (
          <li key={c.name}>
            <button
              type="button"
              aria-pressed={active}
              aria-label={`${c.name}${c.count !== undefined ? ` (${c.count})` : ''}`}
              title={c.name}
              onClick={() => onToggle('color', c.name)}
              className="flex h-11 w-11 items-center justify-center rounded-full"
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border border-black/10 transition-shadow',
                  active ? 'ring-2 ring-brand-500 ring-offset-2' : 'hover:ring-2 hover:ring-ink-200 hover:ring-offset-1',
                )}
                style={{ backgroundColor: c.hex || '#e5e7eb' }}
              >
                {active && <Check size={14} strokeWidth={3} className="text-white mix-blend-difference" aria-hidden="true" />}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Faceted filters bound to `useShopParams()`.
 * Props: `facets` (GET /products/filters), `shop` (useShopParams result), `loading`, `hideCategory`.
 */
export function FilterPanel({ facets, shop, loading, hideCategory = false }) {
  if (loading && !facets) return <PanelSkeleton />;
  const { filters, setParam, setParams, toggleListValue } = shop;
  const categories = facets?.categories ?? [];
  const brands = facets?.brands ?? [];
  const sizes = facets?.sizes ?? [];
  const colors = facets?.colors ?? [];

  return (
    <div className={cn('transition-opacity', loading && 'opacity-60')}>
      {!hideCategory && categories.length > 0 && (
        <FilterSection title="Category" badge={filters.category ? 1 : 0}>
          <CheckList
            label="Category"
            noun="categories"
            items={categories.map((c) => ({
              key: c.slug,
              label: c.name,
              count: c.count,
              checked: filters.category === c.slug,
              onToggle: () => setParam('category', filters.category === c.slug ? '' : c.slug),
            }))}
          />
        </FilterSection>
      )}

      {brands.length > 0 && (
        <FilterSection title="Brand" badge={filters.brand.length}>
          <CheckList
            label="Brand"
            noun="brands"
            items={brands.map((b) => ({
              key: b.slug,
              label: b.name,
              count: b.count,
              checked: filters.brand.some((s) => eq(s, b.slug)),
              onToggle: () => toggleListValue('brand', b.slug),
            }))}
          />
        </FilterSection>
      )}

      <FilterSection title="Price Range" badge={filters.minPrice || filters.maxPrice ? 1 : 0}>
        <PriceFilter
          key={`${filters.minPrice}-${filters.maxPrice}`}
          minPrice={filters.minPrice}
          maxPrice={filters.maxPrice}
          range={facets?.priceRange}
          onApply={setParams}
        />
      </FilterSection>

      <FilterSection title="Rating" badge={filters.rating ? 1 : 0}>
        <ul className="space-y-0.5" role="radiogroup" aria-label="Customer rating">
          {RATINGS.map((r) => {
            const active = filters.rating === String(r);
            return (
              <li key={r}>
                <OptionRow type="radio" checked={active} label={<Stars value={r} />} onToggle={() => setParam('rating', active ? '' : r)} />
              </li>
            );
          })}
        </ul>
      </FilterSection>

      <FilterSection title="Discount" badge={filters.discount ? 1 : 0}>
        <ul className="space-y-0.5" role="radiogroup" aria-label="Discount">
          {DISCOUNTS.map((d) => {
            const active = filters.discount === String(d);
            return (
              <li key={d}>
                <OptionRow type="radio" checked={active} label={`${d}% or more`} onToggle={() => setParam('discount', active ? '' : d)} />
              </li>
            );
          })}
        </ul>
      </FilterSection>

      <FilterSection title="Availability" badge={filters.inStock ? 1 : 0}>
        <OptionRow checked={filters.inStock} label="In Stock only" onToggle={() => setParam('inStock', filters.inStock ? '' : 'true')} />
      </FilterSection>

      {sizes.length > 0 && (
        <FilterSection title="Size" badge={filters.size.length}>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
            {sizes.map((s) => {
              const active = filters.size.some((v) => eq(v, s.value));
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleListValue('size', s.value)}
                  className={cn(chipClass(active), 'min-w-11')}
                >
                  {s.value}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      {colors.length > 0 && (
        <FilterSection title="Color" badge={filters.color.length}>
          <ColorSwatches colors={colors} selected={filters.color} onToggle={toggleListValue} />
        </FilterSection>
      )}
    </div>
  );
}

export default FilterPanel;
