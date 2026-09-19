import { Breadcrumb } from '@/components/ui';
import { cn } from '@/utils/cn';

/** Title block for listing pages. Props: `title`, `description`, `eyebrow`, `breadcrumbs`, `children`, `className`. */
export function ListingHeader({ title, description, eyebrow, breadcrumbs, children, className }) {
  return (
    <header className={cn('pt-4 pb-5 sm:pt-6 sm:pb-6', className)}>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
      <div className="mt-3 max-w-3xl sm:mt-4">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="font-display text-[26px] leading-tight font-bold tracking-tight text-ink-900 sm:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 text-sm leading-relaxed text-ink-500 sm:text-base">{description}</p>}
      </div>
      {children}
    </header>
  );
}

export default ListingHeader;
