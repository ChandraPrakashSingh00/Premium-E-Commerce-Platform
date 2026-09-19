import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../api/payments';
import { adminKey, listQueryOptions } from './shared';

export const useAdminPayments = (params) =>
  useQuery({ queryKey: adminKey('payments', 'list', params), queryFn: () => paymentsApi.list(params), ...listQueryOptions });

export const useAdminPayment = (id) =>
  useQuery({ queryKey: adminKey('payments', 'detail', id), queryFn: () => paymentsApi.get(id), enabled: Boolean(id) });
