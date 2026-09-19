import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button, controlClasses } from '@/components/ui';
import { useDebounce } from '@/hooks';
import { cn } from '@/utils/cn';

// `key` is reserved by React and must not be spread into props.
const withoutKey = ({ key: _key, ...rest }) => rest;

/** Search box that reports its value after a debounce; stays in sync with external resets. */
export function SearchInput({ value = '', onChange, placeholder = 'Search…', label = 'Search', delay = 350, className }) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, delay);
  const lastSent = useRef(value);
  const inputId = useId();

  useEffect(() => {
    // External change (e.g. "Clear filters") wins over local text.
    if (value !== lastSent.current) {
      lastSent.current = value;
      setText(value);
    }
  }, [value]);

  useEffect(() => {
    const next = debounced.trim();
    if (next !== lastSent.current) {
      lastSent.current = next;
      onChange(next);
    }
  }, [debounced, onChange]);

  return (
    <div className={cn('relative min-w-0', className)}>
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <Search size={17} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-400" aria-hidden="true" />
      <input
        id={inputId}
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className={cn(controlClasses(false), 'h-10 rounded-lg pr-9 pl-10')}
      />
      {text && (
        <button
          type="button"
          onClick={() => setText('')}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-700"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/**
 * Compact native select for filter rows. The empty option reads "All <label>" (e.g. "All Status");
 * pass `allLabel` for a named default (e.g. Sort: Newest) or `allText` to override it entirely.
 */
export function FilterSelect({ label, value = '', onChange, options, allLabel, allText, className }) {
  const emptyText = allText ?? (allLabel ? `${label}: ${allLabel}` : `All ${label}`);
  return (
    <label className={cn('relative block', className)}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          controlClasses(false),
          'h-10 appearance-none truncate rounded-lg pr-9 pl-3 text-ink-700',
          value && 'border-brand-200 bg-brand-50/60 font-medium text-ink-900',
        )}
      >
        <option value="">{emptyText}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {allLabel ? `${label}: ${o.label}` : o.label}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-ink-500" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}

/** From / to date inputs (values are `yyyy-mm-dd`). */
export function DateRangeInputs({ from = '', to = '', onChange, className }) {
  const uid = useId();
  const input = cn(controlClasses(false), 'h-10 min-w-0 flex-1 rounded-lg px-3 tabular-nums');
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label className="sr-only" htmlFor={`${uid}-from`}>
        From date
      </label>
      <input id={`${uid}-from`} type="date" value={from} max={to || undefined} onChange={(e) => onChange({ from: e.target.value, to })} className={input} />
      <span className="text-ink-400" aria-hidden="true">
        –
      </span>
      <label className="sr-only" htmlFor={`${uid}-to`}>
        To date
      </label>
      <input id={`${uid}-to`} type="date" value={to} min={from || undefined} onChange={(e) => onChange({ from, to: e.target.value })} className={input} />
    </div>
  );
}

/**
 * Filter row above a table.
 * search: { value, onChange, placeholder }
 * filters: [{ key, label, value, options, onChange }]
 * dateRange: { from, to, onChange }
 */
export function FilterBar({ search, filters = [], dateRange, onReset, activeCount = 0, children, className }) {
  return (
    <div
      className={cn('mb-4 flex flex-col gap-2.5 rounded-xl border border-line bg-white p-3 lg:flex-row lg:flex-wrap lg:items-center', className)}
      role="search"
    >
      {search && <SearchInput {...search} className="lg:max-w-md lg:min-w-64 lg:flex-1" />}
      <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center [&>*]:min-w-0">
        {filters.map((f) => (
          <FilterSelect key={f.key} {...withoutKey(f)} />
        ))}
        {dateRange && <DateRangeInputs {...dateRange} className="col-span-2" />}
        {children}
        {onReset && activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} leftIcon={<X size={14} />}>
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
