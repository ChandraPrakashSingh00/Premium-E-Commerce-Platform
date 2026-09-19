import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryClient';
import { cleanParams, productsApi } from './api';

export { useShopParams, SHOP_PARAM_KEYS } from './useShopParams';

/** Paginated product list. Keeps the previous page on screen while the next one loads. */
export function useProducts(params, { enabled = true } = {}) {
  const clean = cleanParams(params);
  return useQuery({
    queryKey: queryKeys.products(clean),
    queryFn: () => productsApi.list(clean),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Facets for the filter panel (scoped by `category` / `q`). */
export function useProductFilters({ category, q } = {}) {
  const clean = cleanParams({ category, q });
  return useQuery({
    queryKey: queryKeys.productFilters(clean),
    queryFn: () => productsApi.filters(clean),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => productsApi.detail(slug),
    enabled: Boolean(slug),
  });
}

export function useRelatedProducts(slug, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.related(slug),
    queryFn: () => productsApi.related(slug, 8),
    enabled: Boolean(slug) && enabled,
    staleTime: 5 * 60_000,
  });
}

export function useFrequentlyBought(slug, { enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.frequentlyBought(slug),
    queryFn: () => productsApi.frequentlyBought(slug, 3),
    enabled: Boolean(slug) && enabled,
    staleTime: 5 * 60_000,
  });
}

/** Typeahead suggestions (min 2 chars – pass a debounced term). */
export function useSuggestions(q) {
  const term = (q || '').trim();
  return useQuery({
    queryKey: queryKeys.suggestions(term.toLowerCase()),
    queryFn: () => productsApi.suggestions(term),
    enabled: term.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 2 * 60_000,
  });
}

/** Curated home rails: `{ featured, trending, newArrivals, bestSellers }`. */
export function useHomeProducts() {
  return useQuery({ queryKey: queryKeys.home, queryFn: productsApi.home, staleTime: 5 * 60_000 });
}

export const LOW_STOCK_THRESHOLD = 5;

/** Stock label/tone for a product or variant. */
export function stockStatus(stock = 0, inStock = stock > 0) {
  if (!inStock || stock <= 0) return { tone: 'danger', label: 'Out of stock', available: false };
  if (stock <= LOW_STOCK_THRESHOLD) return { tone: 'warning', label: `Only ${stock} left`, available: true };
  return { tone: 'success', label: 'In stock', available: true };
}
