import { cn } from '@/utils/cn';

/** Heading block for auth forms. */
export function AuthHeader({ eyebrow, title, description, className }) {
  return (
    <div className={cn('mb-6 sm:mb-7', className)}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">{title}</h1>
      {description && <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{description}</p>}
    </div>
  );
}

/** Centered status block (success / error screens in the auth flow). */
export function AuthStatus({ icon, tone = 'neutral', title, description, children }) {
  const tones = {
    neutral: 'bg-surface text-ink-700 ring-ink-100',
    success: 'bg-success-50 text-success-600 ring-success-50/50',
    danger: 'bg-danger-50 text-danger-600 ring-danger-50/50',
    brand: 'bg-brand-50 text-brand-600 ring-brand-50/50',
  };
  return (
    <div className="text-center" role="status" aria-live="polite">
      <div className={cn('mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ring-8', tones[tone])}>{icon}</div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">{title}</h1>
      {description && <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-500 sm:text-base">{description}</p>}
      {children && <div className="mt-8 flex flex-col gap-3">{children}</div>}
    </div>
  );
}
