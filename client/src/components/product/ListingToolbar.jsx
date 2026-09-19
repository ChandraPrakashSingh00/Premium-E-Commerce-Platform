import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { controlClasses } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { SortSelect } from './SortSelect';

/** "Search within results" field bound to the `q` URL param. Re-mount (key) when `q` changes. */
function SearchWithin({ value, onSubmit }) {
  const [term, setTerm] = useState(value);
  return (
    <form
      role="search"
      className="relative min-w-0 flex-1 sm:max-w-xs"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(term.trim());
      }}
    >
      <label htmlFor="listing-search" className="sr-only">
        Search within results
      </label>
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
      <input
        id="listing-search"
        type="search"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Search within results"
        enterKeyHint="search"
        className={cn(controlClasses(false), 'h-11 bg-surface pr-10 pl-10 [&::-webkit-search-cancel-button]:hidden')}
      />
      {term && (
        <button
          type="button"
          onClick={() => {
            setTerm('');
            if (value) onSubmit('');
          }}
          className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 hover:text-ink-900"
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </form>
  );
}

/** Desktop top bar: result count · search within · sort. */
export function ListingToolbar({ total, shop, showSearch = true }) {
  const q = shop.params.q ?? '';
  return (
    <div className="mb-4 hidden flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-3 pl-4 lg:flex">
      <p className="mr-auto text-sm text-ink-500" aria-live="polite">
        {total === undefined ? (
          'Loading products…'
        ) : (
          <>
            Showing <span className="font-semibold text-ink-900">{formatNumber(total)}</span> {total === 1 ? 'product' : 'products'}
          </>
        )}
      </p>
      {showSearch && <SearchWithin key={q} value={q} onSubmit={(v) => shop.setParam('q', v)} />}
      <div className="flex items-center gap-2">
        <label htmlFor="product-sort" className="text-sm whitespace-nowrap text-ink-500">
          Sort by:
        </label>
        <SortSelect value={shop.sort} onChange={(v) => shop.setParam('sort', v)} className="w-52" hideLabel />
      </div>
    </div>
  );
}

/** Mobile sticky Filters + Sort pair. */
export function MobileListingBar({ total, shop, onOpenFilters }) {
  const active = shop.activeCount;
  return (
    <div className="sticky top-16 z-30 -mx-4 mb-4 border-b border-line bg-white px-4 py-2.5 sm:-mx-6 sm:px-6 lg:hidden">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenFilters}
          className="flex h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white text-sm font-semibold text-ink-900 hover:border-brand-500"
          aria-label={`Filters${active ? `, ${active} active` : ''}`}
        >
          <SlidersHorizontal size={16} className="text-brand-500" aria-hidden="true" />
          Filters
          {active > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] text-white">{active}</span>
          )}
        </button>
        <SortSelect id="product-sort-mobile" value={shop.sort} onChange={(v) => shop.setParam('sort', v)} />
      </div>
      {total !== undefined && (
        <p className="mt-2 text-xs text-ink-500" aria-live="polite">
          {formatNumber(total)} {total === 1 ? 'product' : 'products'}
        </p>
      )}
    </div>
  );
}
