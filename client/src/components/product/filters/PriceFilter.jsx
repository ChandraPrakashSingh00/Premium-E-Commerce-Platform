import { useState } from 'react';
import { controlClasses } from '@/components/ui';
import { cn } from '@/utils/cn';
import { OptionRow } from './OptionRow';

const PRESETS = [
  { label: 'Under ₹999', min: '', max: '999' },
  { label: '₹1,000 – ₹2,499', min: '1000', max: '2499' },
  { label: '₹2,500 – ₹4,999', min: '2500', max: '4999' },
  { label: '₹5,000 – ₹9,999', min: '5000', max: '9999' },
  { label: '₹10,000 & above', min: '10000', max: '' },
];

function PriceInput({ label, value, onChange, placeholder, invalid }) {
  return (
    <label className="min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-ink-400" aria-hidden="true">
          ₹
        </span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(controlClasses(invalid), 'h-10 pr-2 pl-7')}
        />
      </span>
    </label>
  );
}

/**
 * Price range options + min/max inputs. Local input state is seeded from the URL;
 * the parent re-mounts it (via `key`) when the URL values change.
 */
export function PriceFilter({ minPrice, maxPrice, range, onApply }) {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  const invalid = min !== '' && max !== '' && Number(min) > Number(max);
  const dirty = min !== minPrice || max !== maxPrice;

  const apply = (e) => {
    e?.preventDefault();
    if (invalid) return;
    onApply({ minPrice: min, maxPrice: max });
  };

  return (
    <div>
      <ul className="space-y-0.5" role="radiogroup" aria-label="Price range">
        {PRESETS.map((p) => {
          const active = p.min === minPrice && p.max === maxPrice;
          return (
            <li key={p.label}>
              <OptionRow
                type="radio"
                checked={active}
                label={p.label}
                onToggle={() => onApply(active ? { minPrice: '', maxPrice: '' } : { minPrice: p.min, maxPrice: p.max })}
              />
            </li>
          );
        })}
      </ul>
      <form onSubmit={apply} className="mt-3 flex items-center gap-2">
        <PriceInput
          label="Minimum price"
          value={min}
          onChange={setMin}
          invalid={invalid}
          placeholder={range?.min !== undefined ? String(Math.floor(range.min)) : 'Min'}
        />
        <span className="text-ink-300" aria-hidden="true">
          –
        </span>
        <PriceInput
          label="Maximum price"
          value={max}
          onChange={setMax}
          invalid={invalid}
          placeholder={range?.max !== undefined ? String(Math.ceil(range.max)) : 'Max'}
        />
        <button
          type="submit"
          disabled={invalid || !dirty}
          className="h-10 shrink-0 rounded-lg bg-brand-500 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:bg-ink-100 disabled:text-ink-400"
          aria-label="Apply price range"
        >
          Go
        </button>
      </form>
      {invalid && <p className="mt-2 text-xs text-danger-600">Min price should be lower than max price.</p>}
    </div>
  );
}
