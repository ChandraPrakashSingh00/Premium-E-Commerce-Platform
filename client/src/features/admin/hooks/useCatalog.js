import { useQuery } from '@tanstack/react-query';
import { brandsApi } from '../api/brands';
import { categoriesApi } from '../api/categories';
import { adminKey, useAdminMutation } from './shared';

/** Admin category list is flat (all levels, incl. unpublished). */
export const useAdminCategories = (params = {}) =>
  useQuery({ queryKey: adminKey('categories', params), queryFn: () => categoriesApi.list(params), staleTime: 30_000 });

export const useAdminBrands = (params = {}) =>
  useQuery({ queryKey: adminKey('brands', params), queryFn: () => brandsApi.list(params), staleTime: 30_000 });

const catInvalidate = [['categories'], ['products']];
const brandInvalidate = [['brands'], ['products']];
const storefront = [['categories'], ['brands']];

export const useSaveCategory = (opts = {}) =>
  useAdminMutation({
    mutationFn: ({ id, input }) => (id ? categoriesApi.update(id, input) : categoriesApi.create(input)),
    invalidate: catInvalidate,
    invalidateKeys: storefront,
    success: (_d, { id }) => (id ? 'Category updated' : 'Category created'),
    errorTitle: 'Could not save category',
    ...opts,
  });

/** Delete errors are handled by the caller (409 → explain why). */
export const useDeleteCategory = (opts = {}) =>
  useAdminMutation({
    mutationFn: categoriesApi.remove,
    invalidate: catInvalidate,
    invalidateKeys: storefront,
    success: 'Category deleted',
    silentError: true,
    ...opts,
  });

export const useToggleCategoryPublish = () =>
  useAdminMutation({
    mutationFn: ({ id, isPublished }) => categoriesApi.setPublished(id, isPublished),
    invalidate: catInvalidate,
    invalidateKeys: storefront,
    success: (_d, { isPublished }) => (isPublished ? 'Category published' : 'Category hidden'),
    errorTitle: 'Could not update category',
  });

export const useSaveBrand = (opts = {}) =>
  useAdminMutation({
    mutationFn: ({ id, input }) => (id ? brandsApi.update(id, input) : brandsApi.create(input)),
    invalidate: brandInvalidate,
    invalidateKeys: storefront,
    success: (_d, { id }) => (id ? 'Brand updated' : 'Brand created'),
    errorTitle: 'Could not save brand',
    ...opts,
  });

export const useDeleteBrand = (opts = {}) =>
  useAdminMutation({
    mutationFn: brandsApi.remove,
    invalidate: brandInvalidate,
    invalidateKeys: storefront,
    success: 'Brand deleted',
    silentError: true,
    ...opts,
  });

export const useToggleBrandPublish = () =>
  useAdminMutation({
    mutationFn: ({ id, isPublished }) => brandsApi.setPublished(id, isPublished),
    invalidate: brandInvalidate,
    invalidateKeys: storefront,
    success: (_d, { isPublished }) => (isPublished ? 'Brand published' : 'Brand hidden'),
    errorTitle: 'Could not update brand',
  });
