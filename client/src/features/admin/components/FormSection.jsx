import { cn } from '@/utils/cn';

/** Titled card used to group form fields (product form, settings...). */
export function FormSection({ id, title, description, action, children, className, bodyClassName }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn('scroll-mt-24 rounded-xl border border-line bg-white', className)}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
        <div>
          <h2 id={id ? `${id}-title` : undefined} className="text-base font-semibold text-ink-900">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
        </div>
        {action}
      </div>
      <div className={cn('space-y-5 px-5 py-5 sm:px-6', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small key/value row for detail panels. */
export function DetailRow({ label, children, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2 text-sm', className)}>
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words text-ink-900">{children ?? '—'}</dd>
    </div>
  );
}

/** Input character counter (e.g. SEO title 42/70). */
export function CharCount({ value = '', max }) {
  const len = value?.length ?? 0;
  return (
    <span className={cn('text-xs tabular-nums', len > max ? 'font-semibold text-danger-600' : 'text-ink-400')} aria-live="polite">
      {len}/{max}
    </span>
  );
}
