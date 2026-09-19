import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Collapsible filter group with an accessible disclosure button. */
export function FilterSection({ title, children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="border-b border-line py-2.5 last:border-b-0">
      <h3 className="text-sm font-semibold text-ink-900">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={id}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2">
            {title}
            {badge > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">{badge}</span>
            )}
          </span>
          <ChevronDown size={16} className={cn('text-ink-400 transition-transform duration-200', open && 'rotate-180')} aria-hidden="true" />
        </button>
      </h3>
      <div id={id} hidden={!open} className="pb-2">
        {children}
      </div>
    </div>
  );
}
