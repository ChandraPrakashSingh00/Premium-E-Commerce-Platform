import { z } from 'zod';
import { COUPON_TYPE } from '../constants/index.js';
import { paginationQuery, searchText } from './common.validator.js';

const code = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, 'Code must be at least 3 characters')
  .max(30)
  .regex(/^[A-Z0-9_-]+$/, 'Coupon code may only contain letters, numbers, - and _');

const money = z.coerce.number().min(0).max(10_000_000);

const couponFields = {
  code,
  description: z.string().trim().max(300).optional(),
  discountType: z.enum(Object.values(COUPON_TYPE)),
  discountValue: z.coerce.number().positive('Discount must be greater than 0'),
  minOrderAmount: money.optional(),
  maxDiscount: money.optional(),
  startsAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date(),
  usageLimit: z.coerce.number().int().min(0).optional(),
  perUserLimit: z.coerce.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
};

const checkPercentage = (v, ctx) => {
  if (v.discountType === COUPON_TYPE.PERCENTAGE && v.discountValue > 100) {
    ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Percentage discount cannot exceed 100' });
  }
  if (v.startsAt && v.expiresAt && v.expiresAt <= v.startsAt) {
    ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expiry date must be after start date' });
  }
};

export const createCouponSchema = z.object(couponFields).superRefine(checkPercentage);

export const updateCouponSchema = z
  .object(couponFields)
  .partial()
  .superRefine(checkPercentage)
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const couponStatusSchema = z.object({ isActive: z.boolean() });

export const listCouponsQuery = paginationQuery.extend({
  q: searchText.optional(),
  status: z.enum(['active', 'inactive', 'expired', 'scheduled']).optional(),
});
