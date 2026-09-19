import { useQuery } from '@tanstack/react-query';
import { couponsApi } from '../api/coupons';
import { adminKey, listQueryOptions, useAdminMutation } from './shared';

export const useAdminCoupons = (params) =>
  useQuery({ queryKey: adminKey('coupons', 'list', params), queryFn: () => couponsApi.list(params), ...listQueryOptions });

export const useAdminCoupon = (id) =>
  useQuery({ queryKey: adminKey('coupons', 'detail', id), queryFn: () => couponsApi.get(id), enabled: Boolean(id) });

const INVALIDATE = [['coupons']];
const PUBLIC = [['coupons', 'available']];

export const useSaveCoupon = (opts = {}) =>
  useAdminMutation({
    mutationFn: ({ id, input }) => (id ? couponsApi.update(id, input) : couponsApi.create(input)),
    invalidate: INVALIDATE,
    invalidateKeys: PUBLIC,
    success: (_d, { id }) => (id ? 'Coupon updated' : 'Coupon created'),
    errorTitle: 'Could not save coupon',
    ...opts,
  });

/** Delete errors are handled by the caller (409 → suggest deactivating). */
export const useDeleteCoupon = (opts = {}) =>
  useAdminMutation({
    mutationFn: couponsApi.remove,
    invalidate: INVALIDATE,
    invalidateKeys: PUBLIC,
    success: 'Coupon deleted',
    silentError: true,
    ...opts,
  });

export const useToggleCoupon = () =>
  useAdminMutation({
    mutationFn: ({ id, isActive }) => couponsApi.setStatus(id, isActive),
    invalidate: INVALIDATE,
    invalidateKeys: PUBLIC,
    success: (_d, { isActive }) => (isActive ? 'Coupon activated' : 'Coupon deactivated'),
    errorTitle: 'Could not update coupon',
  });
