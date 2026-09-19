import { ArrowUpDown, ChevronDown } from 'lucide-react';
import { SORT_OPTIONS } from '@/constants';
import { cn } from '@/utils/cn';

const PRODUCT_SORT_OPTIONS = [...SORT_OPTIONS, { value: 'discount', label: 'Biggest Discount' }];

/**
 * Compact native sort select (best mobile picker UX).
 * Props: `value`, `onChange(value)`, `className`, `id`, `hideLabel` (when a visible <label> is rendered elsewhere).
 */
export function SortSelect({ value = 'featured', onChange, className, id = 'product-sort', hideLabel = false }) {
  return (
    <div className={cn('relative', className)}>
      {!hideLabel && (
        <label htmlFor={id} className="sr-only">
          Sort products
        </label>
      )}
      <ArrowUpDown size={15} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-brand-500" aria-hidden="true" />
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value === 'featured' ? '' : e.target.value)}
        className="h-11 w-full cursor-pointer appearance-none rounded-lg border border-line bg-white pr-9 pl-9 text-sm font-semibold text-ink-900 transition-colors hover:border-brand-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
      >
        {PRODUCT_SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-400" aria-hidden="true" />
    </div>
  );
}

export default SortSelect;
