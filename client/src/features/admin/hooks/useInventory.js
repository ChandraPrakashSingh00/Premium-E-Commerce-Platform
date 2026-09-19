import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory';
import { adminKey, listQueryOptions, useAdminMutation } from './shared';

export const useInventory = (params) =>
  useQuery({ queryKey: adminKey('inventory', 'list', params), queryFn: () => inventoryApi.list(params), ...listQueryOptions });

export const useInventoryTransactions = (params, { enabled = true } = {}) =>
  useQuery({
    queryKey: adminKey('inventory', 'transactions', params),
    queryFn: () => inventoryApi.transactions(params),
    enabled,
    ...listQueryOptions,
  });

export const useAdjustInventory = (opts = {}) =>
  useAdminMutation({
    mutationFn: ({ id, input }) => inventoryApi.adjust(id, input),
    invalidate: [['inventory'], ['products'], ['dashboard']],
    success: 'Stock updated',
    errorTitle: 'Could not adjust stock',
    ...opts,
  });
