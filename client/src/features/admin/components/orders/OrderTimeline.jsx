import { ORDER_STATUS_LABELS } from '@/constants';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { SectionCard } from './SectionCard';

const DOT = {
  cancelled: 'bg-danger-500',
  delivered: 'bg-success-600',
  refunded: 'bg-ink-400',
  returned: 'bg-ink-400',
};

/** Status history, newest first. */
export function OrderTimeline({ history = [] }) {
  const entries = [...history].reverse();
  return (
    <SectionCard title="Timeline">
      {entries.length === 0 ? (
        <p className="text-sm text-ink-500">No status changes recorded yet.</p>
      ) : (
        <ol className="relative">
          {entries.map((entry, i) => (
            <li key={`${entry.status}-${entry.at}-${i}`} className="relative flex gap-3 pb-5 last:pb-0">
              {i < entries.length - 1 && <span className="absolute top-4 bottom-0 left-[5px] w-px bg-line" aria-hidden="true" />}
              <span
                className={cn(
                  'relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-white',
                  i === 0 ? (DOT[entry.status] ?? 'bg-brand-500') : 'bg-ink-300',
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className={cn('text-sm font-medium', i === 0 ? 'text-ink-900' : 'text-ink-700')}>
                    {ORDER_STATUS_LABELS[entry.status] ?? entry.status}
                  </p>
                  <time dateTime={entry.at} className="text-xs text-ink-500 tabular-nums">
                    {formatDateTime(entry.at)}
                  </time>
                </div>
                {entry.note && <p className="mt-0.5 text-sm break-words text-ink-500">{entry.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}
