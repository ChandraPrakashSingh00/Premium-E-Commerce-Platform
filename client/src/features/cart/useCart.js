import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { ApiError } from '@/services/apiClient';
import { queryClient, queryKeys } from '@/services/queryClient';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { useGuestCartStore } from '@/store/guestCartStore';
import { toast } from '@/store/toastStore';
import { useUiStore } from '@/store/uiStore';
import { cartApi, EMPTY_CART } from './api';

const setServerCart = (cart) => queryClient.setQueryData(queryKeys.cart, cart);

/**
 * Unified cart for guests and signed-in users. All money values come from the
 * server (`/cart` or `/cart/preview`); the client only tracks ids + quantities.
 * Line identifiers: signed-in → cart line `_id`; guest → `variantId` (the API
 * returns it as `_id` in preview mode), so `item._id` works in both cases.
 */
export function useCart() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const authStatus = useAuthStore((s) => s.status);
  const guestItems = useGuestCartStore((s) => s.items);
  const guestCoupon = useGuestCartStore((s) => s.couponCode);

  const serverQuery = useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartApi.get,
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  const previewPayload = useMemo(() => ({ items: guestItems, couponCode: guestCoupon }), [guestItems, guestCoupon]);
  const guestQuery = useQuery({
    queryKey: queryKeys.cartPreview(previewPayload),
    queryFn: () => cartApi.preview(previewPayload),
    enabled: !isAuthenticated && authStatus !== 'loading' && authStatus !== 'idle' && guestItems.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const active = isAuthenticated ? serverQuery : guestQuery;
  const cart = isAuthenticated ? (serverQuery.data ?? EMPTY_CART) : guestItems.length ? (guestQuery.data ?? EMPTY_CART) : EMPTY_CART;
  const isLoading = authStatus === 'idle' || authStatus === 'loading' || (active.isLoading && active.fetchStatus !== 'idle');

  const openDrawer = useUiStore((s) => s.open);

  const addMutation = useMutation({
    mutationFn: async ({ variantId, quantity = 1 }) => {
      if (isAuthenticated) return setServerCart(await cartApi.addItem({ variantId, quantity }));
      useGuestCartStore.getState().add(variantId, quantity);
      return null;
    },
    onSuccess: (_data, vars) => {
      if (vars?.silent) return;
      toast.show({
        title: 'Added to your cart',
        tone: 'success',
        action: { label: 'View cart', onClick: () => openDrawer('cart') },
      });
    },
    onError: (error) => toast.error('Could not add to cart', error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity }) => {
      if (isAuthenticated) return setServerCart(await cartApi.updateItem(id, quantity));
      useGuestCartStore.getState().update(id, quantity);
      return null;
    },
    onError: (error) => toast.error('Could not update quantity', error.message),
  });

  const removeMutation = useMutation({
    mutationFn: async (id) => {
      if (isAuthenticated) return setServerCart(await cartApi.removeItem(id));
      useGuestCartStore.getState().remove(id);
      return null;
    },
    onError: (error) => toast.error('Could not remove item', error.message),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) return setServerCart(await cartApi.clear());
      useGuestCartStore.getState().clear();
      return null;
    },
  });

  const couponMutation = useMutation({
    mutationFn: async (code) => {
      if (isAuthenticated) return setServerCart(await cartApi.applyCoupon(code));
      const preview = await cartApi.preview({ items: guestItems, couponCode: code });
      if (preview.couponError) throw new ApiError(preview.couponError, { status: 422 });
      useGuestCartStore.getState().setCoupon(code.toUpperCase());
      return preview;
    },
  });

  const removeCouponMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) return setServerCart(await cartApi.removeCoupon());
      useGuestCartStore.getState().setCoupon(null);
      return null;
    },
  });

  const refetch = useCallback(() => active.refetch(), [active]);

  return {
    cart,
    items: cart.items,
    summary: cart.summary,
    itemCount: isAuthenticated ? cart.summary.itemCount : guestItems.reduce((n, i) => n + i.quantity, 0),
    isGuest: !isAuthenticated,
    isLoading,
    isFetching: active.isFetching,
    isError: active.isError,
    error: active.error,
    refetch,
    addItem: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateItem: (id, quantity) => updateMutation.mutateAsync({ id, quantity }),
    removeItem: removeMutation.mutateAsync,
    clearCart: clearMutation.mutateAsync,
    applyCoupon: couponMutation.mutateAsync,
    isApplyingCoupon: couponMutation.isPending,
    removeCoupon: removeCouponMutation.mutateAsync,
    isMutating: updateMutation.isPending || removeMutation.isPending || clearMutation.isPending,
  };
}
