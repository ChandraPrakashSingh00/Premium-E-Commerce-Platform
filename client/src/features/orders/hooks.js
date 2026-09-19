import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { payWithRazorpay, paymentResultPath } from '@/features/checkout/payment';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { queryClient, queryKeys } from '@/services/queryClient';
import { toast } from '@/store/toastStore';
import { ordersApi } from './api';

export function useOrders(params) {
  return useQuery({
    queryKey: queryKeys.orders(params),
    queryFn: () => ordersApi.list(params),
    placeholderData: keepPreviousData,
  });
}

/** `options` are forwarded to useQuery (e.g. `refetchInterval` for polling). */
export function useOrder(id, options = {}) {
  return useQuery({
    queryKey: queryKeys.order(id),
    queryFn: () => ordersApi.get(id),
    enabled: Boolean(id),
    staleTime: 15_000,
    ...options,
  });
}

const storeOrder = (order) => {
  if (order?._id) queryClient.setQueryData(queryKeys.order(order._id), order);
  queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.accountStats });
};

export function useCancelOrder(id) {
  return useMutation({
    mutationFn: (reason) => ordersApi.cancel(id, reason),
    onSuccess: (order) => {
      storeOrder(order);
      toast.success(
        'Order cancelled',
        order?.paymentStatus === 'paid' || order?.refund?.status === 'pending' ? 'Your refund has been initiated.' : undefined,
      );
    },
  });
}

export function useReturnOrder(id) {
  return useMutation({
    mutationFn: (body) => ordersApi.requestReturn(id, body),
    onSuccess: (order) => {
      storeOrder(order);
      toast.success('Return requested', 'We will review your request and update you shortly.');
    },
  });
}

/**
 * Retry payment for a pending online order: POST /orders/:id/pay → Razorpay →
 * server verification → success/failure page.
 */
export function useRetryPayment() {
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  return useMutation({
    mutationFn: async (orderId) => {
      const { order, payment } = await ordersApi.pay(orderId);
      if (order) storeOrder(order);
      if (!payment) throw new Error('This order can no longer be paid online.');
      const result = await payWithRazorpay(payment, { storeName: settings.storeName });
      return { orderId, result };
    },
    onSuccess: ({ orderId, result }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
      if (result.outcome === 'cancelled') {
        toast.info('Payment cancelled', 'Your order is still reserved – you can try again.');
        return;
      }
      navigate(paymentResultPath(orderId, result), { replace: true });
    },
    onError: (error) => toast.error('Could not start payment', error.message),
  });
}
