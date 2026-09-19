import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Accessible disclosure row (button + region).
 * Props: `title`, `defaultOpen`, `headingLevel` (2-4), `className`, `children`.
 */
export function AccordionItem({ title, children, defaultOpen = false, headingLevel = 3, className }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const Heading = `h${headingLevel}`;
  return (
    <div className={cn('border-b border-line', className)}>
      <Heading>
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="flex min-h-14 w-full items-center justify-between gap-4 py-3.5 text-left text-[15px] font-semibold text-ink-900 hover:text-brand-600"
        >
          {title}
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
              open ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-500',
            )}
            aria-hidden="true"
          >
            <Plus size={16} className={cn('transition-transform duration-300', open && 'rotate-45')} />
          </span>
        </button>
      </Heading>
      <div id={id} role="region" aria-labelledby={`${id}-trigger`} hidden={!open} className="pb-5 text-sm leading-relaxed text-ink-600">
        {children}
      </div>
    </div>
  );
}

export default AccordionItem;
