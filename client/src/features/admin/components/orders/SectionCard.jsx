import { useId } from 'react';
import { cn } from '@/utils/cn';

/** Compact titled card used across the order detail page. */
export function SectionCard({ title, description, action, children, className, bodyClassName, flush = false }) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className={cn('rounded-xl border border-line bg-white', className)}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold text-ink-900">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-xs text-ink-500">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={cn(!flush && 'px-5 py-4', bodyClassName)}>{children}</div>
    </section>
  );
}
