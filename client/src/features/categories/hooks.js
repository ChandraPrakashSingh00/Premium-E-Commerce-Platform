import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryClient';
import { categoriesApi } from './api';

/** Published category tree `[{ _id, name, slug, description, image, productCount, children }]`. */
export function useCategories() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: categoriesApi.tree, staleTime: 10 * 60_000 });
}

/** `{ category, children, breadcrumbs }` */
export function useCategory(slug) {
  return useQuery({
    queryKey: queryKeys.category(slug),
    queryFn: () => categoriesApi.detail(slug),
    enabled: Boolean(slug),
    staleTime: 10 * 60_000,
  });
}

export function useBrands() {
  return useQuery({ queryKey: queryKeys.brands, queryFn: categoriesApi.brands, staleTime: 10 * 60_000 });
}
