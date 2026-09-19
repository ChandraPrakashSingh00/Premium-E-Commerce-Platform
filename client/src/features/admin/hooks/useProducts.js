import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import { adminKey, listQueryOptions, useAdminMutation } from './shared';

const INVALIDATE = [['products'], ['inventory'], ['dashboard'], ['categories'], ['brands']];

export const useAdminProducts = (params) =>
  useQuery({ queryKey: adminKey('products', 'list', params), queryFn: () => productsApi.list(params), ...listQueryOptions });

export const useAdminProduct = (id) =>
  useQuery({ queryKey: adminKey('products', 'detail', id), queryFn: () => productsApi.get(id), enabled: Boolean(id), staleTime: 0 });

export const useCreateProduct = (opts = {}) =>
  useAdminMutation({ mutationFn: productsApi.create, invalidate: INVALIDATE, errorTitle: 'Could not create product', ...opts });

export const useUpdateProduct = (opts = {}) =>
  useAdminMutation({
    mutationFn: ({ id, input }) => productsApi.update(id, input),
    invalidate: INVALIDATE,
    errorTitle: 'Could not save product',
    ...opts,
  });

/** Delete errors are handled by the caller (409 → suggest unpublishing). */
export const useDeleteProduct = (opts = {}) =>
  useAdminMutation({ mutationFn: productsApi.remove, invalidate: INVALIDATE, success: 'Product deleted', silentError: true, ...opts });

export const useToggleProductPublish = () =>
  useAdminMutation({
    mutationFn: ({ id, isPublished }) => productsApi.setPublished(id, isPublished),
    invalidate: INVALIDATE,
    success: (_d, { isPublished }) => (isPublished ? 'Product published' : 'Product moved to drafts'),
    errorTitle: 'Could not update product',
  });
