import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authApi } from '@/features/auth/api';
import { setSessionUser } from '@/features/auth/useSession';
import { queryClient, queryKeys } from '@/services/queryClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { accountApi, cleanAddress } from './api';

/* ---------------------------------- Profile --------------------------------- */

export function useUpdateProfile() {
  return useMutation({
    mutationFn: accountApi.updateProfile,
    onSuccess: (user) => {
      setSessionUser(user);
      toast.success('Profile updated');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }) => authApi.changePassword({ currentPassword, newPassword }),
    onSuccess: (user) => {
      setSessionUser(user);
      toast.success('Password changed', 'You have been signed out of your other devices.');
    },
  });
}

export function useResendVerification() {
  return useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: () => toast.success('Verification email sent', 'Check your inbox (and spam folder).'),
    onError: (error) => toast.error('Could not send email', error.message),
  });
}

export function useLogoutAll() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.logoutAll,
    onSuccess: () => {
      useAuthStore.getState().clear();
      ['cart', 'wishlist', 'account', 'orders', 'notifications', 'auth'].forEach((root) =>
        queryClient.removeQueries({ queryKey: [root] }),
      );
      toast.success('Signed out everywhere', 'Sign in again to continue.');
      navigate('/login', { replace: true });
    },
    onError: (error) => toast.error('Could not sign out of all devices', error.message),
  });
}

/** Optimistic preference toggles – the server response replaces the session user. */
export function useUpdatePreferences() {
  return useMutation({
    mutationFn: accountApi.updatePreferences,
    onMutate: (patch) => {
      const user = useAuthStore.getState().user;
      if (!user) return { previous: null };
      setSessionUser({ ...user, preferences: { ...user.preferences, ...patch } });
      return { previous: user };
    },
    onSuccess: (user) => setSessionUser(user),
    onError: (error, _patch, context) => {
      if (context?.previous) setSessionUser(context.previous);
      toast.error('Could not save preference', error.message);
    },
  });
}

/* ---------------------------------- Stats ----------------------------------- */

export function useAccountStats() {
  return useQuery({ queryKey: queryKeys.accountStats, queryFn: accountApi.stats, staleTime: 30_000 });
}

/* -------------------------------- Addresses --------------------------------- */

export function useAddresses() {
  return useQuery({ queryKey: queryKeys.addresses, queryFn: accountApi.addresses, staleTime: 60_000 });
}

const refreshAddresses = () => queryClient.invalidateQueries({ queryKey: queryKeys.addresses });

export function useSaveAddress() {
  return useMutation({
    mutationFn: ({ id, values }) =>
      id ? accountApi.updateAddress(id, cleanAddress(values)) : accountApi.createAddress(cleanAddress(values)),
    onSuccess: (_address, { id }) => {
      refreshAddresses();
      toast.success(id ? 'Address updated' : 'Address added');
    },
  });
}

export function useDeleteAddress() {
  return useMutation({
    mutationFn: accountApi.deleteAddress,
    onSuccess: () => {
      refreshAddresses();
      toast.success('Address removed');
    },
    onError: (error) => toast.error('Could not remove address', error.message),
  });
}

export function useSetDefaultAddress() {
  return useMutation({
    mutationFn: accountApi.setDefaultAddress,
    onSuccess: (addresses) => {
      if (Array.isArray(addresses)) queryClient.setQueryData(queryKeys.addresses, addresses);
      else refreshAddresses();
      toast.success('Default address updated');
    },
    onError: (error) => toast.error('Could not update default address', error.message),
  });
}

/* --------------------------------- Reviews ---------------------------------- */

export function useMyReviews(params) {
  return useQuery({
    queryKey: queryKeys.myReviews(params),
    queryFn: () => accountApi.myReviews(params),
    placeholderData: keepPreviousData,
  });
}

export const refreshMyReviews = () => {
  queryClient.invalidateQueries({ queryKey: ['account', 'reviews'] });
  queryClient.invalidateQueries({ queryKey: queryKeys.accountStats });
};

export function useDeleteReview() {
  return useMutation({
    mutationFn: accountApi.deleteReview,
    onSuccess: () => {
      refreshMyReviews();
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review deleted');
    },
    onError: (error) => toast.error('Could not delete review', error.message),
  });
}
