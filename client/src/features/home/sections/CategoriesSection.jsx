import { Link } from 'react-router';
import { SectionHeading, ViewAllLink } from '@/components/product/ProductRail';
import { ErrorState, Skeleton, SmartImage } from '@/components/ui';
import { useCategories } from '@/features/categories/hooks';
import { categoryImage } from '../content';

const ITEM = 'w-[27%] shrink-0 snap-start min-[480px]:w-[21%] sm:w-[17%] md:w-[14%] lg:w-auto';
const LIST =
  'scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 sm:-mx-6 sm:gap-4 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-8 lg:gap-4 lg:overflow-visible lg:px-0 xl:gap-5';

export function CategoriesSection() {
  const { data: categories = [], isPending, isError, error, refetch } = useCategories();
  const list = categories.slice(0, 8);
  if (!isPending && !isError && list.length === 0) return null;

  return (
    <section className="py-6 sm:py-10" aria-labelledby="categories-heading">
      <div className="container-page">
        <SectionHeading id="categories-heading" title="Shop by Category" action={<ViewAllLink to="/shop" />} />
        {isError ? (
          <ErrorState error={error} onRetry={refetch} compact className="rounded-xl border border-line" />
        ) : (
          <ul className={LIST}>
            {isPending
              ? Array.from({ length: 8 }, (_, i) => (
                  <li key={i} className={ITEM}>
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <Skeleton className="mx-auto mt-2.5 h-3.5 w-3/4" />
                  </li>
                ))
              : list.map((cat, i) => (
                  <li key={cat._id} className={ITEM}>
                    <Link to={`/category/${cat.slug}`} className="group block rounded-xl text-center">
                      <span className="block rounded-xl border border-transparent bg-surface p-2 transition-colors duration-200 group-hover:border-brand-200 group-hover:bg-brand-50 sm:p-3">
                        <SmartImage
                          src={categoryImage(cat, i)}
                          alt=""
                          width={320}
                          sizes="(min-width: 1024px) 11vw, 27vw"
                          aspect="1 / 1"
                          className="rounded-lg"
                          imgClassName="transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </span>
                      <span className="mt-2 line-clamp-2 text-[13px] leading-tight font-medium text-ink-900 transition-colors group-hover:text-brand-600 sm:text-sm">
                        {cat.name}
                      </span>
                    </Link>
                  </li>
                ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default CategoriesSection;
