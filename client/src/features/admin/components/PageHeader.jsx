import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { cn } from '@/utils/cn';

/** Page title block used by every admin page (also sets the document title). */
export function PageHeader({ title, description, actions, back, eyebrow, meta, className }) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <Seo title={`${typeof title === 'string' ? title : 'Admin'} · Admin`} noindex />
      <div className="min-w-0">
        {back && (
          <Link
            to={back.to}
            className="mb-2 inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-500 hover:text-brand-600"
          >
            <ArrowLeft size={15} aria-hidden="true" />
            {back.label}
          </Link>
        )}
        {eyebrow && <p className="mb-1 text-xs font-medium tracking-wide text-ink-500 uppercase">{eyebrow}</p>}
        <h1 className="truncate font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px] sm:leading-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-500">{description}</p>}
        {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
