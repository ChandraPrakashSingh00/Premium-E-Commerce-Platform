import { Star } from 'lucide-react';
import { Rating } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';

/**
 * Average rating + clickable 5→1 breakdown bars.
 * Props: `summary` ({ average, count, breakdown }), `activeRating`, `onFilter(rating | null)`.
 */
export function ReviewSummary({ summary, activeRating, onFilter }) {
  const count = summary?.count ?? 0;
  const average = Number(summary?.average ?? 0);
  const breakdown = summary?.breakdown ?? {};

  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <div className="flex items-center gap-4">
        <p className="font-display text-5xl leading-none font-bold tracking-tight text-ink-900">
          {average.toFixed(1)}
          <span className="text-lg font-medium text-ink-400">/5</span>
        </p>
        <div>
          <Rating value={average} size={16} />
          <p className="mt-1 text-sm text-ink-500">
            Based on {formatNumber(count)} {count === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>
      <ul className="mt-5 space-y-0.5 border-t border-line pt-4">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = Number(breakdown[star] ?? 0);
          const pct = count ? Math.round((n / count) * 100) : 0;
          const active = Number(activeRating) === star;
          return (
            <li key={star}>
              <button
                type="button"
                disabled={!n && !active}
                onClick={() => onFilter(active ? null : star)}
                aria-pressed={active}
                aria-label={`${star} star reviews: ${n}. ${active ? 'Remove filter' : 'Show only these'}`}
                className={cn(
                  'group flex min-h-9 w-full items-center gap-3 rounded-lg px-2 text-sm transition-colors disabled:cursor-default disabled:opacity-50',
                  active ? 'bg-brand-50 ring-1 ring-brand-200' : 'enabled:hover:bg-surface',
                )}
              >
                <span className="flex w-7 items-center gap-0.5 font-medium text-ink-700">
                  {star}
                  <Star size={12} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <span className="block h-full rounded-full bg-brand-500 transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </span>
                <span className="w-9 text-right text-xs text-ink-500 tabular-nums">{pct}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ReviewSummary;
