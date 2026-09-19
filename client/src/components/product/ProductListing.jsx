import { useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button, EmptyState, ErrorState, Pagination } from '@/components/ui';
import { useProductFilters, useProducts, useShopParams } from '@/features/products/hooks';
import { cn } from '@/utils/cn';
import { ActiveFilterChips } from './ActiveFilterChips';
import { FilterDrawer } from './FilterDrawer';
import { FilterPanel } from './FilterPanel';
import { ListingToolbar, MobileListingBar } from './ListingToolbar';
import { ProductGrid } from './ProductGrid';

const PAGE_SIZE = 12;

/**
 * URL-driven product listing (filters sidebar/drawer, sort, grid, pagination).
 * Shared by Shop, Category and Search pages.
 * Props:
 *  - `fixedParams`  params that always apply and cannot be changed by the user (e.g. `{ category }`)
 *  - `hideCategoryFilter`
 *  - `showSearch`   show the "search within results" field (default true)
 *  - `renderEmpty(clear)` custom empty state
 */
export function ProductListing({ fixedParams = {}, hideCategoryFilter = false, showSearch = true, renderEmpty }) {
  const shop = useShopParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const topRef = useRef(null);

  const params = { ...shop.params, ...fixedParams, limit: PAGE_SIZE };
  const products = useProducts(params);
  const facetsQuery = useProductFilters({ category: params.category, q: params.q });

  const data = products.data;
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total;
  const clear = () => shop.clearFilters();

  const onPage = (page) => {
    shop.setPage(page);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const hasFilters = shop.activeCount > 0;

  let content;
  if (products.isError && !data) {
    content = <ErrorState error={products.error} onRetry={() => products.refetch()} className="rounded-xl border border-line bg-white" />;
  } else if (products.isPending) {
    content = <ProductGrid loading columns={3} skeletonCount={9} />;
  } else if (items.length === 0) {
    content = renderEmpty ? (
      renderEmpty(clear)
    ) : (
      <EmptyState
        className="rounded-xl border border-line bg-white px-4"
        icon={<SlidersHorizontal size={28} strokeWidth={1.5} />}
        title={hasFilters ? 'No products match these filters' : 'No products yet'}
        description={hasFilters ? 'Try removing a filter or widening your price range.' : 'New products are on their way. Check back soon.'}
        action={
          hasFilters ? (
            <Button onClick={clear}>Clear all filters</Button>
          ) : (
            <Button to="/shop" variant="outline">
              Browse all products
            </Button>
          )
        }
      />
    );
  } else {
    content = (
      <>
        <div className={cn('transition-opacity duration-200', products.isPlaceholderData && 'opacity-50')} aria-busy={products.isFetching}>
          <ProductGrid items={items} columns={3} priorityCount={3} />
        </div>
        <Pagination page={pagination?.page ?? shop.page} totalPages={pagination?.totalPages} onChange={onPage} className="mt-10" />
      </>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-20 lg:scroll-mt-36">
      <MobileListingBar total={total} shop={shop} onOpenFilters={() => setDrawerOpen(true)} />

      <div className="lg:grid lg:grid-cols-[264px_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-33 lg:block" aria-label="Product filters">
          <div className="scrollbar-none max-h-[calc(100dvh-9.5rem)] overflow-y-auto overscroll-contain rounded-xl border border-line bg-white px-5 pt-4 pb-3">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                <SlidersHorizontal size={17} className="text-brand-500" aria-hidden="true" />
                Filters
              </h2>
              <button
                type="button"
                onClick={clear}
                disabled={!hasFilters}
                className="min-h-9 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-default disabled:text-ink-300"
              >
                Clear all
              </button>
            </div>
            <FilterPanel facets={facetsQuery.data} shop={shop} loading={facetsQuery.isFetching} hideCategory={hideCategoryFilter} />
          </div>
        </aside>

        <div className="min-w-0">
          <ListingToolbar total={total} shop={shop} showSearch={showSearch} />
          {hasFilters && (
            <div className="mb-4">
              <ActiveFilterChips shop={shop} facets={facetsQuery.data} hideCategory={hideCategoryFilter} onClear={clear} />
            </div>
          )}
          {content}
        </div>
      </div>

      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        facets={facetsQuery.data}
        shop={shop}
        loading={facetsQuery.isFetching}
        hideCategory={hideCategoryFilter}
        total={total}
        fetching={products.isFetching}
        onClear={clear}
      />
    </div>
  );
}

export default ProductListing;
