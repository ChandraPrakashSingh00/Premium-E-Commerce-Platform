import { Link } from 'react-router';
import { ArrowUpRight, Clock, Search, TrendingUp, X } from 'lucide-react';
import { Skeleton, SmartImage } from '@/components/ui';
import { useCategories } from '@/features/categories/hooks';
import { categoryImage, POPULAR_SEARCHES } from '@/features/home/content';
import { useRecentSearchStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

function Highlight({ text, term }) {
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0 || !term) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-transparent font-semibold text-brand-600">{text.slice(i, i + term.length)}</mark>
      {text.slice(i + term.length)}
    </>
  );
}

function Group({ title, children }) {
  return (
    <div>
      <p className="mb-3 font-display text-sm font-semibold text-ink-900">{title}</p>
      {children}
    </div>
  );
}

/** Suggestion results (products, categories, brands) rendered as a single listbox. */
export function SearchResults({ listId, data, options, active, term, loading, isError, onHover, onSelect }) {
  if (loading) {
    return (
      <div className="space-y-4" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-1/2" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (isError) return <p className="text-sm text-ink-500">Suggestions are unavailable. Press Enter to search.</p>;

  const empty = !data?.products?.length && !data?.categories?.length && !data?.brands?.length;
  const optionProps = (opt, index) => ({
    id: `${listId}-${index}`,
    role: 'option',
    'aria-selected': index === active,
    onMouseEnter: () => onHover(index),
    onClick: (e) => {
      e.preventDefault();
      onSelect(opt);
    },
  });
  const indexed = options.map((opt, index) => ({ opt, index }));
  const of = (type) => indexed.filter(({ opt }) => opt.type === type);
  const query = of('query')[0];

  return (
    <div id={listId} role="listbox" aria-label="Search suggestions" className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12 [&>*]:min-w-0">
      <div>
        {empty ? (
          <p className="py-4 text-sm text-ink-500">
            No quick matches for “{term}”. Press Enter to search the full catalogue.
          </p>
        ) : (
          of('product').length > 0 && (
            <Group title="Products">
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 [&>*]:min-w-0">
                {of('product').map(({ opt, index }) => (
                  <li key={opt.key}>
                    <a
                      href={opt.href}
                      {...optionProps(opt, index)}
                      className={cn('flex items-center gap-3.5 rounded-xl border p-2 transition-colors', index === active ? 'border-brand-200 bg-brand-50' : 'border-transparent hover:bg-surface')}
                    >
                      <SmartImage src={opt.item.thumbnail} alt="" width={120} className="h-16 w-16 shrink-0 rounded-lg" />
                      <span className="min-w-0 flex-1">
                        {opt.item.brandName && <span className="block text-[11px] font-semibold tracking-wide text-ink-400 uppercase">{opt.item.brandName}</span>}
                        <span className="line-clamp-1 text-sm text-ink-700">
                          <Highlight text={opt.item.name} term={term} />
                        </span>
                        <span className="mt-0.5 block text-sm font-bold text-ink-900">{formatPrice(opt.item.price)}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Group>
          )
        )}
        {query && (
          <a
            href={query.opt.href}
            {...optionProps(query.opt, query.index)}
            className={cn(
              'mt-4 flex min-h-12 items-center justify-between rounded-lg border px-4 text-sm font-semibold text-brand-600 transition-colors',
              query.index === active ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-brand-300',
            )}
          >
            <span className="flex items-center gap-2.5">
              <Search size={16} className="text-brand-500" aria-hidden="true" />
              See all results for “{term}”
            </span>
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        )}
      </div>

      {(of('category').length > 0 || of('brand').length > 0) && (
        <div className="space-y-8">
          {[
            ['category', 'Categories'],
            ['brand', 'Brands'],
          ].map(([type, title]) =>
            of(type).length ? (
              <Group key={type} title={title}>
                <ul className="space-y-0.5">
                  {of(type).map(({ opt, index }) => (
                    <li key={opt.key}>
                      <a
                        href={opt.href}
                        {...optionProps(opt, index)}
                        className={cn('flex min-h-11 items-center rounded-lg px-3 text-sm text-ink-700', index === active ? 'bg-brand-50 text-brand-700' : 'hover:bg-surface')}
                      >
                        <Highlight text={opt.item.name} term={term} />
                      </a>
                    </li>
                  ))}
                </ul>
              </Group>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}

const chip = 'inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3.5 text-sm text-ink-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700';
const heading = 'font-display text-sm font-semibold text-ink-900';

/** Shown before the shopper types: recent searches, popular terms and categories. */
export function SearchIdle({ onPick }) {
  const terms = useRecentSearchStore((s) => s.terms);
  const remove = useRecentSearchStore((s) => s.remove);
  const clear = useRecentSearchStore((s) => s.clear);
  const { data: categories = [] } = useCategories();

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-16 [&>*]:min-w-0">
      <div className="space-y-8">
        {terms.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className={heading}>Recent searches</p>
              <button type="button" onClick={clear} className="min-h-9 text-xs font-semibold text-brand-600 hover:text-brand-700">
                Clear all
              </button>
            </div>
            <ul className="divide-y divide-line">
              {terms.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <button type="button" onClick={() => onPick(t)} className="flex min-h-12 flex-1 items-center gap-3 text-left text-sm text-ink-800">
                    <Clock size={16} className="text-ink-300" aria-hidden="true" />
                    {t}
                  </button>
                  <button type="button" onClick={() => remove(t)} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-400 hover:bg-surface hover:text-ink-900" aria-label={`Remove ${t} from recent searches`}>
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className={`${heading} mb-3`}>Popular right now</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_SEARCHES.map((t) => (
              <button key={t} type="button" onClick={() => onPick(t)} className={chip}>
                <TrendingUp size={14} className="text-brand-500" aria-hidden="true" />
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      {categories.length > 0 && (
        <div>
          <p className={`${heading} mb-3`}>Shop by category</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {categories.slice(0, 8).map((c, i) => (
              <li key={c._id}>
                <Link to={`/category/${c.slug}`} className="group block">
                  <span className="block rounded-xl bg-surface p-2 transition-colors group-hover:bg-brand-50">
                    <SmartImage src={categoryImage(c, i)} alt="" width={240} sizes="120px" aspect="1 / 1" className="rounded-lg" imgClassName="transition-transform duration-500 group-hover:scale-105" />
                  </span>
                  <span className="mt-2 block truncate text-center text-xs font-medium text-ink-800 group-hover:text-brand-600 sm:text-sm">{c.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
