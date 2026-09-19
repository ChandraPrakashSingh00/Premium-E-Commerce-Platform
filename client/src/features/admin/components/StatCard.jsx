import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/ui';
import { cn } from '@/utils/cn';

/** Change text (green ↑ / red ↓); `inverse` flips the good/bad colouring (e.g. refunds going up is bad). */
export function ChangeIndicator({ change, inverse = false, suffix = 'vs previous period' }) {
  if (change === null || change === undefined || Number.isNaN(Number(change))) {
    return <span className="text-xs text-ink-400">No comparison</span>;
  }
  const value = Number(change);
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  const good = inverse ? !up : up;
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
      <span className={cn('inline-flex items-center gap-0.5 font-semibold tabular-nums', flat ? 'text-ink-500' : good ? 'text-success-600' : 'text-danger-600')}>
        <Icon size={13} strokeWidth={2.25} aria-hidden="true" />
        <span className="sr-only">{flat ? 'No change' : up ? 'Up' : 'Down'} </span>
        {Math.abs(value).toFixed(1)}%
      </span>
      <span className="text-ink-400">{suffix}</span>
    </span>
  );
}

const CHIPS = {
  neutral: 'bg-brand-50 text-brand-500',
  brand: 'bg-brand-50 text-brand-500',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  success: 'bg-success-50 text-success-600',
};

/**
 * KPI tile: small grey label, big bold value, change vs previous period, icon in a tinted rounded square.
 * `compact` renders a smaller horizontal tile (secondary KPIs).
 */
export function StatCard({ label, value, change, hint, icon: Icon, loading, inverse, tone = 'neutral', to, className, footer, compact = false, changeSuffix }) {
  const chip = CHIPS[tone] ?? CHIPS.neutral;

  const iconChip = Icon && (
    <span className={cn('flex shrink-0 items-center justify-center rounded-xl', compact ? 'h-10 w-10' : 'h-12 w-12', chip)} aria-hidden="true">
      <Icon size={compact ? 19 : 22} strokeWidth={1.75} />
    </span>
  );

  const body = compact ? (
    <div className="flex items-center gap-3.5">
      {iconChip}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink-500">{label}</p>
        {loading ? <Skeleton className="mt-1 h-6 w-16" /> : <p className="font-display text-xl leading-tight font-bold text-ink-900 tabular-nums">{value}</p>}
      </div>
      {hint && !loading && <p className="hidden max-w-[45%] text-right text-xs text-ink-500 sm:block">{hint}</p>}
    </div>
  ) : (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-ink-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-28" />
          ) : (
            <p className="mt-1.5 font-display text-2xl leading-tight font-bold tracking-tight break-words text-ink-900 tabular-nums sm:text-[1.75rem]">{value}</p>
          )}
        </div>
        {iconChip}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-4 w-36" />
      ) : (
        <>
          <div className="mt-2.5 min-h-5">
            {change !== undefined ? (
              <ChangeIndicator change={change} inverse={inverse} suffix={changeSuffix} />
            ) : (
              hint && <span className="text-xs text-ink-500">{hint}</span>
            )}
          </div>
          {change !== undefined && hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
          {footer}
        </>
      )}
    </>
  );

  const classes = cn(
    'block rounded-xl border border-line bg-white',
    compact ? 'px-4 py-3.5' : 'p-5',
    to && 'transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-soft focus-visible:border-brand-500',
    className,
  );
  if (to) {
    return (
      <Link to={to} className={classes}>
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}
