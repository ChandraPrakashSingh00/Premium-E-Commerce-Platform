import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search, SearchX } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { ListingHeader } from '@/components/product/ListingHeader';
import { ProductListing } from '@/components/product/ProductListing';
import { Button, SmartImage } from '@/components/ui';
import { useCategories } from '@/features/categories/hooks';
import { categoryImage, POPULAR_SEARCHES } from '@/features/home/content';
import { useRecentSearchStore, useUiStore } from '@/store/uiStore';

function Suggestions({ title = 'Popular searches' }) {
  const { data: categories = [] } = useCategories();
  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-center font-display text-base font-semibold text-ink-900">{title}</p>
      <ul className="mt-4 flex flex-wrap justify-center gap-2">
        {POPULAR_SEARCHES.map((t) => (
          <li key={t}>
            <Link
              to={`/search?q=${encodeURIComponent(t)}`}
              className="inline-flex min-h-10 items-center rounded-lg border border-line bg-white px-4 text-sm text-ink-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
            >
              {t}
            </Link>
          </li>
        ))}
      </ul>
      {categories.length > 0 && (
        <>
          <p className="mt-10 text-center font-display text-base font-semibold text-ink-900">Popular categories</p>
          <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {categories.slice(0, 4).map((c, i) => (
              <li key={c._id}>
                <Link to={`/category/${c.slug}`} className="group block">
                  <span className="block rounded-xl border border-line bg-white p-2 transition-colors group-hover:border-brand-200 group-hover:bg-brand-50">
                    <SmartImage
                      src={categoryImage(c, i)}
                      alt=""
                      width={400}
                      sizes="(min-width: 640px) 22vw, 45vw"
                      aspect="1 / 1"
                      className="rounded-lg"
                      imgClassName="transition-transform duration-500 group-hover:scale-105"
                    />
                  </span>
                  <span className="mt-2 block text-center text-sm font-medium group-hover:text-brand-600">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const addRecent = useRecentSearchStore((s) => s.add);
  const openOverlay = useUiStore((s) => s.open);

  useEffect(() => {
    if (q) addRecent(q);
  }, [q, addRecent]);

  if (!q) {
    return (
      <div className="container-page pb-16">
        <Seo title="Search" noindex />
        <ListingHeader
          title="Search"
          description="Find products, brands and categories across the BlueMart catalogue."
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Search' }]}
        >
          <Button className="mt-5" leftIcon={<Search size={18} />} onClick={() => openOverlay('search')}>
            Start searching
          </Button>
        </ListingHeader>
        <Suggestions />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-surface">
      <div className="container-page pb-12 sm:pb-16">
        <Seo title={`Search results for “${q}”`} noindex />
        <ListingHeader
          title={
            <>
              Results for <span className="text-brand-500">“{q}”</span>
            </>
          }
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Search' }]}
        />
        <ProductListing
          key={q}
          showSearch={false}
          renderEmpty={(clear) => (
            <div className="rounded-2xl border border-line bg-white px-4 py-10 text-center sm:py-14">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <SearchX size={28} strokeWidth={1.5} />
              </div>
              <h2 className="heading-md">No results for “{q}”</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">Check the spelling, try a more general term, or remove some filters.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={clear}>
                  Clear filters
                </Button>
                <Button to="/shop">Browse all products</Button>
              </div>
              <div className="mt-12">
                <Suggestions title="Try searching for" />
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
