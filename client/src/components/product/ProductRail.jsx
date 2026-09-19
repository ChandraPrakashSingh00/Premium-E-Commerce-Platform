import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ErrorState } from '@/components/ui';
import { cn } from '@/utils/cn';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

const SIZES = '(min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw';
// Phones show 4 cards (2×2), tablets 6 (3×2), desktop up to 8 (4×2).
const GRID =
  'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 [&>*]:min-w-0 max-sm:[&>li:nth-child(n+5)]:hidden sm:max-lg:[&>li:nth-child(n+7)]:hidden';
const SCROLL =
  'scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 sm:-mx-6 sm:gap-4 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-5 lg:overflow-visible lg:px-0';
const SCROLL_ITEM = 'w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-auto';

/** "View All" style link used in section headers. */
export function ViewAllLink({ to, children = 'View All' }) {
  return (
    <Link to={to} className="group inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
      {children}
      <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

export function SectionHeading({ eyebrow, title, description, action, className, id }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-4 sm:mb-6', className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 id={id} className="font-display text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Titled product section: 2-col grid on phones, 4-col on desktop.
 * Props: `title`, `eyebrow`, `description`, `viewAllTo`, `items`, `loading`, `error`, `onRetry`, `limit`, `className`,
 * `layout` ('grid' | 'scroll' — horizontal snap row on mobile).
 */
export function ProductRail({ title, eyebrow, description, viewAllTo, items = [], loading, error, onRetry, limit = 8, className, layout = 'grid' }) {
  if (!loading && !error && items.length === 0) return null;
  const headingId = `rail-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const list = items.slice(0, limit);
  const scroll = layout === 'scroll';
  const itemCls = scroll ? cn(SCROLL_ITEM, 'flex') : 'flex';

  return (
    <section className={cn('py-8 sm:py-12', className)} aria-labelledby={headingId}>
      <div className="container-page">
        <SectionHeading
          id={headingId}
          eyebrow={eyebrow}
          title={title}
          description={description}
          action={viewAllTo && <ViewAllLink to={viewAllTo} />}
        />
        {error ? (
          <ErrorState error={error} onRetry={onRetry} compact className="rounded-xl border border-line bg-white" />
        ) : (
          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={scroll ? SCROLL : GRID}
          >
            {loading
              ? Array.from({ length: 4 }, (_, i) => (
                  <li key={i} className={scroll ? SCROLL_ITEM : undefined}>
                    <ProductCardSkeleton />
                  </li>
                ))
              : list.map((product) => (
                  <li key={product._id} className={itemCls}>
                    <ProductCard product={product} sizes={SIZES} className="w-full" />
                  </li>
                ))}
          </motion.ul>
        )}
      </div>
    </section>
  );
}

export default ProductRail;
