import { Link, useParams } from 'react-router';
import { SearchX } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { config } from '@/config/env';
import { ProductListing } from '@/components/product/ProductListing';
import { Breadcrumb, Button, EmptyState, ErrorState, Skeleton, SkeletonText, SmartImage } from '@/components/ui';
import { useCategory } from '@/features/categories/hooks';
import { categoryImage } from '@/features/home/content';

function buildCrumbs(category, breadcrumbs = []) {
  const trail = [...breadcrumbs];
  if (trail.at(-1)?.slug !== category.slug) trail.push({ name: category.name, slug: category.slug });
  return [{ label: 'Home', to: '/' }, { label: 'Shop', to: '/shop' }, ...trail.map((b) => ({ label: b.name, to: `/category/${b.slug}` }))];
}

function HeroSkeleton() {
  return (
    <div className="pt-4 pb-5 sm:pt-6" aria-hidden="true">
      <Skeleton className="h-4 w-48" />
      <div className="mt-4 grid grid-cols-1 gap-5 rounded-2xl border border-line bg-white p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_280px] [&>*]:min-w-0">
        <div>
          <Skeleton className="h-9 w-1/2" />
          <SkeletonText className="mt-4 max-w-md" lines={2} />
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
        <Skeleton className="hidden aspect-[16/10] w-full rounded-xl md:block" />
      </div>
    </div>
  );
}

function CategoryHero({ category, subcategories, breadcrumbs }) {
  return (
    <header className="pt-4 pb-5 sm:pt-6">
      <Breadcrumb items={buildCrumbs(category, breadcrumbs)} />
      <div className="mt-4 grid grid-cols-1 items-center gap-5 overflow-hidden rounded-2xl border border-line bg-white p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_260px] lg:grid-cols-[minmax(0,1fr)_320px] [&>*]:min-w-0">
        <div>
          <h1 className="font-display text-[26px] leading-tight font-bold tracking-tight text-ink-900 sm:text-[32px]">{category.name}</h1>
          {category.description && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base">{category.description}</p>}
          {subcategories.length > 0 && (
            <nav aria-label={`${category.name} subcategories`} className="scrollbar-none -mx-5 mt-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
              <ul className="flex gap-2 sm:flex-wrap">
                {subcategories.map((child) => (
                  <li key={child._id} className="shrink-0">
                    <Link
                      to={`/category/${child.slug}`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3.5 text-sm font-medium text-ink-800 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {child.name}
                      {child.productCount > 0 && <span className="text-xs text-ink-400">({child.productCount})</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
        <SmartImage
          src={categoryImage(category)}
          alt={category.name}
          width={700}
          sizes="(min-width: 1024px) 320px, (min-width: 768px) 260px, 100vw"
          priority
          className="hidden aspect-[16/10] rounded-xl md:block"
        />
      </div>
    </header>
  );
}

export default function CategoryPage() {
  const { slug } = useParams();
  const { data, isPending, isError, error, refetch } = useCategory(slug);

  if (isError && error?.status === 404) {
    return (
      <div className="container-page py-6">
        <Seo title="Category not found" noindex />
        <EmptyState
          className="rounded-2xl border border-line bg-white px-4"
          icon={<SearchX size={28} strokeWidth={1.5} />}
          title="We couldn’t find that category"
          description="It may have been renamed or is no longer available."
          action={
            <>
              <Button to="/shop">Browse all products</Button>
              <Button to="/" variant="outline">
                Back to home
              </Button>
            </>
          }
        />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-page py-6">
        <ErrorState error={error} onRetry={refetch} className="rounded-2xl border border-line bg-white" />
      </div>
    );
  }

  const category = data?.category;
  return (
    <div className="min-h-[60vh] bg-surface">
      <div className="container-page pb-12 sm:pb-16">
        {category ? (
          <>
            <Seo
              title={category.seo?.title || category.name}
              description={category.seo?.description || category.description || `Shop ${category.name} at BlueMart.`}
              image={category.image?.url}
              jsonLd={{
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: buildCrumbs(category, data.breadcrumbs).map((c, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  name: c.label,
                  item: `${config.siteUrl}${c.to}`,
                })),
              }}
            />
            <CategoryHero category={category} subcategories={data.children ?? []} breadcrumbs={data.breadcrumbs} />
          </>
        ) : (
          isPending && <HeroSkeleton />
        )}
        <ProductListing key={slug} fixedParams={{ category: slug }} hideCategoryFilter />
      </div>
    </div>
  );
}
