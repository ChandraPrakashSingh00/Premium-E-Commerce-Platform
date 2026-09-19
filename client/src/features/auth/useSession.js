import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { cartApi } from '@/features/cart/api';
import { wishlistApi } from '@/features/wishlist/api';
import { setSessionExpiredHandler } from '@/services/apiClient';
import { queryClient, queryKeys } from '@/services/queryClient';
import { hasSessionHint, useAuthStore } from '@/store/authStore';
import { useGuestCartStore } from '@/store/guestCartStore';
import { useGuestWishlistStore } from '@/store/guestWishlistStore';
import { toast } from '@/store/toastStore';
import { authApi } from './api';

const PRIVATE_QUERY_ROOTS = ['cart', 'wishlist', 'account', 'orders', 'notifications', 'admin', 'auth'];

const clearPrivateCache = () => {
  PRIVATE_QUERY_ROOTS.forEach((root) => queryClient.removeQueries({ queryKey: [root] }));
};

/** Pushes the guest cart / wishlist to the server after sign-in, then clears local copies. */
export async function syncGuestData() {
  const cart = useGuestCartStore.getState();
  const wishlist = useGuestWishlistStore.getState();
  const tasks = [];
  if (cart.items.length) {
    tasks.push(
      cartApi.merge(cart.items).then(async (merged) => {
        cart.clear();
        if (cart.couponCode) {
          return cartApi.applyCoupon(cart.couponCode).catch(() => merged);
        }
        return merged;
      }),
    );
  }
  if (wishlist.productIds.length) {
    tasks.push(wishlistApi.merge(wishlist.productIds).then(() => wishlist.clear()));
  }
  await Promise.allSettled(tasks);
  queryClient.invalidateQueries({ queryKey: queryKeys.cart });
  queryClient.invalidateQueries({ queryKey: queryKeys.wishlist });
}

/** Loads the current user once on app start and wires session-expiry handling. */
export function useBootstrapSession() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      if (useAuthStore.getState().status === 'authenticated') {
        toast.info('Your session has ended', 'Please sign in again to continue.');
      }
      useAuthStore.getState().clear();
      clearPrivateCache();
    });
  }, []);

  useEffect(() => {
    if (status !== 'idle') return;
    // Never signed in on this browser: skip the round-trip (and its 401).
    if (!hasSessionHint()) {
      useAuthStore.getState().setStatus('guest');
      return;
    }
    useAuthStore.getState().setStatus('loading');
    authApi
      .me()
      .then((user) => useAuthStore.getState().setUser(user))
      .catch(() => useAuthStore.getState().clear());
  }, [status]);
}

const onAuthenticated = async (user) => {
  clearPrivateCache();
  useAuthStore.getState().setUser(user);
  if (user.role !== 'ADMIN') await syncGuestData();
};

export function useLogin({ admin = false } = {}) {
  return useMutation({
    mutationFn: (credentials) => (admin ? authApi.adminLogin(credentials) : authApi.login(credentials)),
    onSuccess: onAuthenticated,
  });
}

export function useRegister() {
  return useMutation({ mutationFn: authApi.register, onSuccess: onAuthenticated });
}

export function useLogout() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      useAuthStore.getState().clear();
      clearPrivateCache();
      navigate('/', { replace: true });
    },
  });
}

/** Refreshes the cached user (after profile edits, email verification...). */
export const setSessionUser = (user) => useAuthStore.getState().setUser(user);
