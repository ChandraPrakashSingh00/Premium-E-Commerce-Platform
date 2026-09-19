import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Skeleton, SmartImage } from '@/components/ui';
import { useCategories } from '@/features/categories/hooks';
import { categoryImage } from '@/features/home/content';

function MegaMenuContent({ onNavigate }) {
  const { data: categories = [], isPending, isError } = useCategories();

  if (isPending) {
    return (
      <div className="grid grid-cols-4 gap-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }
  if (isError) return <p className="text-sm text-ink-500">Categories are unavailable right now.</p>;

  const featured = categories.slice(0, 2);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-10">
      <ul className="grid grid-cols-3 gap-x-8 gap-y-7 xl:grid-cols-4">
        {categories.map((cat, i) => (
          <li key={cat._id}>
            <Link to={`/category/${cat.slug}`} onClick={onNavigate} className="group flex items-center gap-3 text-sm font-semibold text-ink-900 hover:text-brand-600">
              <SmartImage src={categoryImage(cat, i)} alt="" width={120} sizes="44px" className="h-11 w-11 shrink-0 rounded-lg" />
              {cat.name}
            </Link>
            {cat.children?.length > 0 && (
              <ul className="mt-3 space-y-1.5 pl-14">
                {cat.children.slice(0, 6).map((child) => (
                  <li key={child._id}>
                    <Link to={`/category/${child.slug}`} onClick={onNavigate} className="text-sm text-ink-500 transition-colors hover:text-brand-600">
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-4">
        {featured.map((cat, i) => (
          <Link key={cat._id} to={`/category/${cat.slug}`} onClick={onNavigate} className="group block">
            <SmartImage src={categoryImage(cat, i)} alt={cat.name} width={400} sizes="190px" aspect="4 / 5" className="rounded-xl" imgClassName="transition-transform duration-700 group-hover:scale-105" />
            <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-600">
              Shop {cat.name}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}

/** Full-width category panel under the navbar (desktop). */
export function MegaMenu({ open, onClose, id, onMouseEnter, onMouseLeave }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id={id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="absolute inset-x-0 top-full hidden border-y border-line bg-white shadow-lift lg:block"
        >
          <div className="container-page max-h-[calc(100dvh-10rem)] overflow-y-auto py-8">
            <MegaMenuContent onNavigate={onClose} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default MegaMenu;
