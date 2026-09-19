import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../api/customers';
import { adminKey, listQueryOptions, useAdminMutation } from './shared';

export const useAdminCustomers = (params) =>
  useQuery({ queryKey: adminKey('customers', 'list', params), queryFn: () => customersApi.list(params), ...listQueryOptions });

export const useAdminCustomer = (id) =>
  useQuery({ queryKey: adminKey('customers', 'detail', id), queryFn: () => customersApi.get(id), enabled: Boolean(id) });

export const useSetCustomerStatus = (opts = {}) =>
  useAdminMutation({
    mutationFn: ({ id, status }) => customersApi.setStatus(id, status),
    invalidate: [['customers']],
    success: (_d, { status }) => (status === 'blocked' ? 'Customer blocked' : 'Customer unblocked'),
    errorTitle: 'Could not update customer',
    ...opts,
  });
