import { Truck } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

/** Progress towards free shipping. Uses server `summary.freeShippingThreshold` / `amountToFreeShipping`. */
export function FreeShippingProgress({ summary, className }) {
  const threshold = Number(summary?.freeShippingThreshold) || 0;
  if (!threshold || !summary?.itemCount) return null;
  const remaining = Math.max(0, Number(summary.amountToFreeShipping) || 0);
  const pct = Math.min(100, Math.max(4, ((threshold - remaining) / threshold) * 100));
  const unlocked = remaining <= 0;

  return (
    <div className={cn('rounded-xl border p-3.5', unlocked ? 'border-success-600/20 bg-success-50' : 'border-brand-100 bg-brand-50', className)}>
      <p className="flex items-center gap-2.5 text-sm text-ink-700">
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white', unlocked ? 'text-success-600' : 'text-brand-500')}>
          <Truck size={16} aria-hidden="true" />
        </span>
        {unlocked ? (
          <span className="font-semibold text-success-600">Yay! You’ve unlocked free shipping</span>
        ) : (
          <span className="min-w-0">
            Add <span className="font-bold text-brand-600">{formatPrice(remaining)}</span> more for <span className="font-semibold text-ink-900">FREE shipping</span>
          </span>
        )}
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Progress to free shipping"
      >
        <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', unlocked ? 'bg-success-600' : 'bg-brand-500')} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default FreeShippingProgress;
