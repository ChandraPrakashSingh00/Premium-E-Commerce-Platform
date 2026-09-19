import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatBucketLong, VALUE_FORMATS } from './theme';

/**
 * Tooltip for time series. `series`: [{ key, label, color, format: 'money'|'count' }]
 */
export function SeriesTooltip({ active, payload, label, series, granularity }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="min-w-[180px] rounded-xl border border-line bg-white px-3.5 py-3 text-sm shadow-lift">
      <p className="mb-2 text-xs font-medium text-ink-500">{formatBucketLong(label, granularity)}</p>
      <ul className="space-y-1.5">
        {series.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-ink-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden="true" />
              {s.label}
            </span>
            <span className="font-semibold text-ink-900 tabular-nums">{VALUE_FORMATS[s.format ?? 'count'](row[s.key] ?? 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartEmpty({ height = 280, title = 'No data for this period', description = 'Activity will appear here once orders come in.' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-surface text-center" style={{ height }}>
      <BarChart3 size={22} className="mb-2 text-ink-300" aria-hidden="true" />
      <p className="text-sm font-medium text-ink-700">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-ink-500">{description}</p>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }) {
  return <Skeleton className="w-full rounded-xl" style={{ height }} />;
}

/** Legend row; identity is never colour alone (label always visible). */
export function Legend({ items, className }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600', className)}>
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={cn('inline-block', item.line ? 'h-0.5 w-3.5' : 'h-2.5 w-2.5 rounded-sm')} style={{ background: item.color }} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** Segmented control (range / metric switch). */
export function Segmented({ options, value, onChange, label, size = 'sm' }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-lg border border-line bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md font-semibold whitespace-nowrap transition-colors',
            size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
            value === o.value ? 'bg-brand-500 text-white' : 'text-ink-600 hover:bg-surface hover:text-ink-900',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
