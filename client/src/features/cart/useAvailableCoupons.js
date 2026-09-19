import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/services/queryClient';
import { cartApi } from './api';

/** Public coupons `[{ code, description, discountType, discountValue, minOrderAmount, maxDiscount, expiresAt }]`. */
export function useAvailableCoupons({ enabled = true } = {}) {
  return useQuery({ queryKey: queryKeys.coupons, queryFn: cartApi.availableCoupons, enabled, staleTime: 5 * 60_000 });
}

/** "20% off (up to ₹500)" / "₹200 off" – display only. */
export function describeCoupon(coupon, formatPrice) {
  const value = coupon.discountType === 'percentage' || coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `${formatPrice(coupon.discountValue)} off`;
  const cap = coupon.maxDiscount ? ` (up to ${formatPrice(coupon.maxDiscount)})` : '';
  const min = coupon.minOrderAmount ? ` on orders above ${formatPrice(coupon.minOrderAmount)}` : '';
  return `${value}${cap}${min}`;
}
