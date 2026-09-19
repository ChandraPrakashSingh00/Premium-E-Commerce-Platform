import { z } from 'zod';
import { formatPrice } from '@/utils/format';
import { toDateTimeInput } from '../../utils';

const money = z.coerce.number({ error: 'Enter an amount' }).min(0, 'Cannot be negative').max(10_000_000, 'Amount is too large');

const localDate = (v) => (v ? new Date(v) : null);
const isValidDate = (v) => !v || !Number.isNaN(new Date(v).getTime());

/** Client mirror of the server's createCouponSchema (form values are strings from inputs). */
export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, 'Code must be at least 3 characters')
      .max(30, 'Code must be 30 characters or fewer')
      .regex(/^[A-Z0-9_-]+$/, 'Coupon code may only contain letters, numbers, - and _'),
    description: z.string().trim().max(300, 'Description must be 300 characters or fewer').optional().default(''),
    discountType: z.enum(['percentage', 'fixed'], { error: 'Choose a discount type' }),
    discountValue: z.coerce.number({ error: 'Enter a discount' }).positive('Discount must be greater than 0').max(10_000_000),
    maxDiscount: money.default(0),
    minOrderAmount: money.default(0),
    startsAt: z.string().optional().default('').refine(isValidDate, 'Enter a valid date'),
    expiresAt: z.string().min(1, 'Expiry date is required').refine(isValidDate, 'Enter a valid date'),
    usageLimit: z.coerce.number({ error: 'Enter a number' }).int('Must be a whole number').min(0, 'Cannot be negative').default(0),
    perUserLimit: z.coerce.number({ error: 'Enter a number' }).int('Must be a whole number').min(1, 'At least 1').max(100, 'At most 100'),
    isActive: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.discountType === 'percentage' && v.discountValue > 100) {
      ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'Percentage discount cannot exceed 100' });
    }
    const start = localDate(v.startsAt);
    const end = localDate(v.expiresAt);
    if (start && end && end <= start) {
      ctx.addIssue({ code: 'custom', path: ['expiresAt'], message: 'Expiry date must be after start date' });
    }
  });

const inDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  return d;
};

/** Form defaults for a new coupon, or values from an existing one. */
export function toCouponFormValues(coupon) {
  if (!coupon) {
    return {
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      maxDiscount: 0,
      minOrderAmount: 0,
      startsAt: toDateTimeInput(new Date()),
      expiresAt: toDateTimeInput(inDays(30)),
      usageLimit: 0,
      perUserLimit: 1,
      isActive: true,
    };
  }
  return {
    code: coupon.code ?? '',
    description: coupon.description ?? '',
    discountType: coupon.discountType ?? 'percentage',
    discountValue: coupon.discountValue ?? '',
    maxDiscount: coupon.maxDiscount ?? 0,
    minOrderAmount: coupon.minOrderAmount ?? 0,
    startsAt: toDateTimeInput(coupon.startsAt),
    expiresAt: toDateTimeInput(coupon.expiresAt),
    usageLimit: coupon.usageLimit ?? 0,
    perUserLimit: coupon.perUserLimit ?? 1,
    isActive: coupon.isActive ?? true,
  };
}

/** Parsed form values → API body (ISO dates, no cap for fixed coupons). */
export function toCouponPayload(values) {
  return {
    code: values.code,
    description: values.description ?? '',
    discountType: values.discountType,
    discountValue: values.discountValue,
    maxDiscount: values.discountType === 'percentage' ? values.maxDiscount : 0,
    minOrderAmount: values.minOrderAmount,
    startsAt: values.startsAt ? new Date(values.startsAt).toISOString() : undefined,
    expiresAt: new Date(values.expiresAt).toISOString(),
    usageLimit: values.usageLimit,
    perUserLimit: values.perUserLimit,
    isActive: values.isActive,
  };
}

/** "20% · max ₹500", "20%", or "₹200 off". */
export function formatDiscount(coupon) {
  if (!coupon) return '';
  if (coupon.discountType === 'percentage') {
    return coupon.maxDiscount > 0 ? `${coupon.discountValue}% · max ${formatPrice(coupon.maxDiscount)}` : `${coupon.discountValue}%`;
  }
  return `${formatPrice(coupon.discountValue)} off`;
}
