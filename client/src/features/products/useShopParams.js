import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

/** URL keys understood by the listing (mirrors GET /products). */
export const SHOP_PARAM_KEYS = [
  'q',
  'category',
  'brand',
  'minPrice',
  'maxPrice',
  'rating',
  'discount',
  'inStock',
  'size',
  'color',
  'sort',
  'page',
  'featured',
  'bestSeller',
  'newArrival',
];

const splitList = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []);
const isEmpty = (v) => v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0);

/**
 * URL-backed listing state. The URL is the single source of truth, so refresh,
 * back/forward and shared links preserve filters. Any filter change resets `page`.
 *
 * Returns `{ params, filters, page, sort, setParam, setParams, toggleListValue, setPage, clearFilters, activeCount }`.
 */
export function useShopParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const out = {};
    for (const key of SHOP_PARAM_KEYS) {
      const value = searchParams.get(key);
      if (value !== null && value !== '') out[key] = value;
    }
    return out;
  }, [searchParams]);

  const filters = useMemo(
    () => ({
      category: params.category ?? '',
      brand: splitList(params.brand),
      size: splitList(params.size),
      color: splitList(params.color),
      minPrice: params.minPrice ?? '',
      maxPrice: params.maxPrice ?? '',
      rating: params.rating ?? '',
      discount: params.discount ?? '',
      inStock: params.inStock === 'true',
    }),
    [params],
  );

  const setParams = useCallback(
    (updates, { resetPage = true, replace = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, raw] of Object.entries(updates)) {
            if (isEmpty(raw)) next.delete(key);
            else next.set(key, Array.isArray(raw) ? raw.join(',') : String(raw));
          }
          if (resetPage && !('page' in updates)) next.delete('page');
          return next;
        },
        { replace, preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  const setParam = useCallback((key, value, opts) => setParams({ [key]: value }, opts), [setParams]);

  const toggleListValue = useCallback(
    (key, value) => {
      const current = filters[key] ?? [];
      const lower = value.toLowerCase();
      const exists = current.some((v) => v.toLowerCase() === lower);
      setParams({ [key]: exists ? current.filter((v) => v.toLowerCase() !== lower) : [...current, value] });
    },
    [filters, setParams],
  );

  const setPage = useCallback((page) => setParams({ page: page > 1 ? page : undefined }, { resetPage: false }), [setParams]);

  /** Clears all filters but keeps the search query, sort and collection flags (plus any `keep` keys). */
  const clearFilters = useCallback(
    (keep = []) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams();
          for (const key of ['q', 'sort', 'featured', 'bestSeller', 'newArrival', ...keep]) {
            const v = prev.get(key);
            if (v) next.set(key, v);
          }
          return next;
        },
        { preventScrollReset: true },
      );
    },
    [setSearchParams],
  );

  const activeCount =
    (filters.category ? 1 : 0) +
    filters.brand.length +
    filters.size.length +
    filters.color.length +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.rating ? 1 : 0) +
    (filters.discount ? 1 : 0) +
    (filters.inStock ? 1 : 0);

  return {
    params,
    filters,
    page: Math.max(1, Number(params.page) || 1),
    sort: params.sort ?? 'featured',
    setParam,
    setParams,
    toggleListValue,
    setPage,
    clearFilters,
    activeCount,
  };
}
