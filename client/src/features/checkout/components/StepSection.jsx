import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, PencilLine } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * One checkout card. Shows the body while active, a one-line summary with an "Edit" action
 * once completed, and a muted header while upcoming.
 * Circle: current = solid blue number · completed = blue check · upcoming = grey outline.
 */
export function StepSection({ number, title, icon: Icon, active, completed, summary, onEdit, children, disabled }) {
  const ref = useRef(null);
  const headingId = `checkout-step-${number}`;

  useEffect(() => {
    if (!active || !ref.current || number === 1) return;
    const top = ref.current.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top, behavior: 'smooth' });
    ref.current.querySelector('h2')?.focus({ preventScroll: true });
  }, [active, number]);

  const done = !active && completed;
  return (
    <section
      ref={ref}
      aria-labelledby={headingId}
      className={cn('rounded-2xl border bg-white transition-[border-color,box-shadow]', active ? 'border-brand-500 shadow-soft' : 'border-line')}
    >
      <header className={cn('flex items-center justify-between gap-3 px-4 py-4 sm:px-6', active && 'border-b border-line')}>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
              active || done ? 'bg-brand-500 text-white' : 'border-2 border-ink-200 text-ink-400',
            )}
            aria-hidden="true"
          >
            {done ? <Check size={16} strokeWidth={3} /> : number}
          </span>
          <div className="min-w-0">
            <h2
              id={headingId}
              tabIndex={-1}
              className={cn('flex items-center gap-2 font-display text-base font-semibold focus:outline-none sm:text-lg', !active && !completed ? 'text-ink-400' : 'text-ink-900')}
            >
              {Icon && <Icon size={18} className={cn('hidden shrink-0 sm:block', active ? 'text-brand-500' : 'text-ink-400')} aria-hidden="true" />}
              {title}
            </h2>
            {done && summary && <div className="mt-0.5 text-sm text-ink-500">{summary}</div>}
          </div>
        </div>
        {done && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            disabled={disabled}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 disabled:opacity-40"
            aria-label={`Edit ${title.toLowerCase()}`}
          >
            <PencilLine size={15} aria-hidden="true" />
            <span className="hidden min-[360px]:inline">Edit</span>
          </button>
        )}
      </header>
      <AnimatePresence initial={false}>
        {active && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 py-5 sm:px-6 sm:py-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
