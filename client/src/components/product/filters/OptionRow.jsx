import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Checkbox/radio-style filter row with an optional count.
 * `type` is 'checkbox' (square) or 'radio' (round); the row itself is the toggle.
 */
export function OptionRow({ checked, onToggle, label, count, type = 'checkbox' }) {
  return (
    <button
      type="button"
      role={type === 'radio' ? 'radio' : 'checkbox'}
      aria-checked={checked}
      onClick={onToggle}
      className="group flex min-h-10 w-full items-center gap-3 rounded-md text-left text-sm"
    >
      <span
        className={cn(
          'flex h-[18px] w-[18px] shrink-0 items-center justify-center border transition-colors',
          type === 'radio' ? 'rounded-full' : 'rounded-[5px]',
          checked ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300 bg-white group-hover:border-brand-400',
        )}
        aria-hidden="true"
      >
        {checked && (type === 'radio' ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : <Check size={12} strokeWidth={3} />)}
      </span>
      <span className={cn('flex min-w-0 flex-1 items-center gap-1 truncate', checked ? 'font-medium text-ink-900' : 'text-ink-700 group-hover:text-ink-900')}>
        {label}
      </span>
      {count !== undefined && <span className="text-xs text-ink-400 tabular-nums">({count})</span>}
    </button>
  );
}

/**
 * List of OptionRows with a "show more" toggle.
 * items: [{ key, label, count, checked, onToggle }]
 */
export function CheckList({ items, limit = 6, noun = 'options', type = 'checkbox', label }) {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? items : items.slice(0, limit);
  return (
    <div>
      <ul className="space-y-0.5" role="group" aria-label={label}>
        {list.map((item) => (
          <li key={item.key}>
            <OptionRow type={type} checked={item.checked} onToggle={item.onToggle} label={item.label} count={item.count} />
          </li>
        ))}
      </ul>
      {items.length > limit && (
        <button type="button" className="mt-1 min-h-9 text-sm font-semibold text-brand-600 hover:text-brand-700" onClick={() => setShowAll((v) => !v)}>
          {showAll ? 'Show less' : `+ ${items.length - limit} more ${noun}`}
        </button>
      )}
    </div>
  );
}
