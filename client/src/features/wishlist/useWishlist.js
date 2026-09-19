import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { http } from '@/services/apiClient';
import { queryClient, queryKeys } from '@/services/queryClient';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { useGuestWishlistStore } from '@/store/guestWishlistStore';
import { toast } from '@/store/toastStore';
import { wishlistApi } from './api';

/** Set of wishlisted product ids – cheap lookup for heart buttons. */
export function useWishlistIds() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const guestIds = useGuestWishlistStore((s) => s.productIds);
  const { data } = useQuery({
    queryKey: queryKeys.wishlistIds,
    queryFn: wishlistApi.ids,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  return useMemo(() => new Set(isAuthenticated ? (data ?? []) : guestIds), [isAuthenticated, data, guestIds]);
}

export function useToggleWishlist() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const ids = useWishlistIds();

  const mutation = useMutation({
    mutationFn: async ({ productId, variantId }) => {
      const wasSaved = ids.has(productId);
      if (!isAuthenticated) {
        useGuestWishlistStore.getState().toggle(productId);
        return { saved: !wasSaved };
      }
      // Optimistic update of the id list.
      queryClient.setQueryData(queryKeys.wishlistIds, (old = []) =>
        wasSaved ? old.filter((id) => id !== productId) : [...old, productId],
      );
      try {
        if (wasSaved) await wishlistApi.remove(productId);
        else await wishlistApi.add(productId, variantId);
      } catch (error) {
        queryClient.invalidateQueries({ queryKey: queryKeys.wishlistIds });
        throw error;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist, exact: true });
      return { saved: !wasSaved };
    },
    onSuccess: ({ saved }) => toast.show({ title: saved ? 'Saved to wishlist' : 'Removed from wishlist', tone: saved ? 'success' : 'default', duration: 2500 }),
    onError: (error) => toast.error('Wishlist update failed', error.message),
  });

  return {
    isSaved: (productId) => ids.has(productId),
    toggle: (productId, variantId) => mutation.mutate({ productId, variantId }),
    isPending: mutation.isPending,
  };
}

/**
 * Full wishlist. Signed-in → server wishlist; guest → product cards fetched by id.
 * Returns `{ items: [{ product, variantId, addedAt }] }`.
 */
export function useWishlist() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const status = useAuthStore((s) => s.status);
  const guestIds = useGuestWishlistStore((s) => s.productIds);

  return useQuery({
    queryKey: isAuthenticated ? queryKeys.wishlist : ['wishlist', 'guest', guestIds],
    enabled: status === 'authenticated' || status === 'guest',
    queryFn: async () => {
      if (isAuthenticated) return wishlistApi.get();
      if (!guestIds.length) return { items: [] };
      const res = await http.get('/products', { ids: guestIds.join(','), limit: 100 });
      const byId = new Map(res.items.map((p) => [p._id, p]));
      return { items: guestIds.filter((id) => byId.has(id)).map((id) => ({ product: byId.get(id), variantId: null, addedAt: null })) };
    },
  });
}

export function useMoveToCart() {
  return useMutation({
    mutationFn: ({ productId, variantId }) => wishlistApi.moveToCart(productId, variantId),
    onSuccess: ({ wishlist, cart }) => {
      queryClient.setQueryData(queryKeys.wishlist, wishlist);
      queryClient.setQueryData(queryKeys.cart, cart);
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlistIds });
      toast.success('Moved to your cart');
    },
    onError: (error) => toast.error('Could not move to cart', error.message),
  });
}
