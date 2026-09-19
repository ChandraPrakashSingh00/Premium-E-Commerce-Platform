import { Fragment } from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router';
import { cn } from '@/utils/cn';
import { checkoutStages } from '../progress';

const circle = {
  complete: 'bg-brand-500 text-white',
  current: 'bg-brand-500 text-white ring-4 ring-brand-100',
  upcoming: 'border-2 border-ink-200 bg-white text-ink-400',
};

function StageMarker({ stage }) {
  return (
    <>
      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors sm:h-10 sm:w-10', circle[stage.status])}>
        {stage.status === 'complete' ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : stage.number}
      </span>
      <span
        className={cn(
          'mt-2 text-xs font-semibold whitespace-nowrap sm:text-sm',
          stage.status === 'upcoming' ? 'text-ink-400' : stage.status === 'current' ? 'text-brand-600' : 'text-ink-900',
        )}
      >
        {stage.label}
      </span>
      <span className="sr-only">{stage.status === 'current' ? ' (current step)' : stage.status === 'complete' ? ' (completed)' : ''}</span>
    </>
  );
}

/**
 * Cart → Address → Payment → Success progress bar.
 * Props: `stage` ('address' | 'payment' | 'success'), `onSelect(stageKey)` for completed in-page stages.
 */
export function CheckoutStepper({ stage, onSelect, className }) {
  const stages = checkoutStages(stage);
  const item = 'group flex min-w-0 flex-col items-center rounded-lg focus-visible:outline-offset-4';
  return (
    <nav aria-label="Checkout progress" className={className}>
      <ol className="flex items-start">
        {stages.map((s, i) => {
          const linkable = s.status === 'complete' && stage !== 'success';
          return (
            <Fragment key={s.key}>
              <li className="flex w-14 shrink-0 flex-col items-center min-[360px]:w-16 sm:w-20" aria-current={s.status === 'current' ? 'step' : undefined}>
                {linkable && s.key === 'cart' ? (
                  <Link to="/cart" className={item} aria-label="Back to cart (completed)">
                    <StageMarker stage={s} />
                  </Link>
                ) : linkable && onSelect ? (
                  <button type="button" onClick={() => onSelect(s.key)} className={item}>
                    <StageMarker stage={s} />
                  </button>
                ) : (
                  <div className={item}>
                    <StageMarker stage={s} />
                  </div>
                )}
              </li>
              {i < stages.length - 1 && (
                <li aria-hidden="true" className="mt-4.5 h-0.5 min-w-3 flex-1 overflow-hidden rounded-full bg-ink-200 sm:mt-5">
                  <span className={cn('block h-full bg-brand-500 transition-[width] duration-500', stages[i + 1].status === 'upcoming' ? 'w-0' : 'w-full')} />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export default CheckoutStepper;
