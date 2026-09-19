import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../api/orders';
import { adminKey, listQueryOptions, useAdminMutation } from './shared';

export const useAdminOrders = (params) =>
  useQuery({ queryKey: adminKey('orders', 'list', params), queryFn: () => ordersApi.list(params), ...listQueryOptions });

export const useAdminOrder = (id) =>
  useQuery({ queryKey: adminKey('orders', 'detail', id), queryFn: () => ordersApi.get(id), enabled: Boolean(id), staleTime: 0 });

const INVALIDATE = [['orders'], ['payments'], ['dashboard'], ['inventory'], ['customers']];

const RETURN_MESSAGES = { approve: 'Return approved', reject: 'Return rejected', complete: 'Return completed' };

/** All order actions share invalidation; `fn(id, vars)` performs the request. */
function useOrderMutation(id, fn, { success, errorTitle, ...opts }) {
  return useAdminMutation({ mutationFn: (vars) => fn(id, vars), invalidate: INVALIDATE, success, errorTitle, ...opts });
}

export const useUpdateOrderStatus = (id, opts = {}) =>
  useOrderMutation(id, ordersApi.updateStatus, { success: 'Order status updated', errorTitle: 'Could not update status', ...opts });

export const useUpdateTracking = (id, opts = {}) =>
  useOrderMutation(id, ordersApi.updateTracking, { success: 'Tracking updated', errorTitle: 'Could not update tracking', ...opts });

export const useCancelOrder = (id, opts = {}) =>
  useOrderMutation(id, ordersApi.cancel, { success: 'Order cancelled', errorTitle: 'Could not cancel order', ...opts });

export const useOrderReturn = (id, opts = {}) =>
  useOrderMutation(id, ordersApi.handleReturn, {
    success: (_d, { action }) => RETURN_MESSAGES[action],
    errorTitle: 'Could not update return',
    ...opts,
  });

export const useRefundOrder = (id, opts = {}) =>
  useOrderMutation(id, ordersApi.refund, { success: 'Refund initiated', errorTitle: 'Refund failed', ...opts });

export const useMarkOrderPaid = (id, opts = {}) =>
  useOrderMutation(id, (orderId) => ordersApi.markPaid(orderId), { success: 'Marked as paid', errorTitle: 'Could not update payment', ...opts });

export const useOrderNote = (id, opts = {}) =>
  useOrderMutation(id, ordersApi.updateNote, { success: 'Note saved', errorTitle: 'Could not save note', ...opts });
