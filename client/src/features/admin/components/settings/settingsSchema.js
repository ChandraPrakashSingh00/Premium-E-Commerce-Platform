import { z } from 'zod';

const number = (min, max, { int = false } = {}) => {
  let s = z.number({ error: 'Enter a number' });
  if (int) s = s.int('Must be a whole number');
  return s.min(min, `Must be at least ${min}`).max(max, `Must be at most ${max.toLocaleString('en-IN')}`);
};
const money = number(0, 10_000_000);
const socialUrl = z.union([z.literal(''), z.string().trim().url('Enter a valid URL (https://…)').max(300)]);

/** Client mirror of the server's updateSettingsSchema (all fields present in the form). */
export const settingsFormSchema = z.object({
  storeName: z.string().trim().min(2, 'Store name must be at least 2 characters').max(80, 'At most 80 characters'),
  supportEmail: z.string().trim().toLowerCase().email('Enter a valid email address').max(254),
  supportPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{10,15}$/, 'Enter a valid phone number'),
  address: z.string().trim().max(300, 'At most 300 characters'),
  announcement: z.string().trim().max(160, 'At most 160 characters'),
  freeShippingThreshold: money,
  shippingFee: money,
  codEnabled: z.boolean(),
  codFee: money,
  codMaxOrderAmount: money,
  returnWindowDays: number(0, 60, { int: true }),
  reservationTtlMinutes: number(5, 1440, { int: true }),
  defaultLowStockThreshold: number(0, 100_000, { int: true }),
  requireReviewModeration: z.boolean(),
  social: z.object({ instagram: socialUrl, facebook: socialUrl, twitter: socialUrl, youtube: socialUrl }),
});

export const SOCIAL_KEYS = ['instagram', 'facebook', 'twitter', 'youtube'];

export const SETTINGS_SECTIONS = [
  { id: 'settings-store', label: 'Store profile' },
  { id: 'settings-storefront', label: 'Storefront' },
  { id: 'settings-shipping', label: 'Shipping' },
  { id: 'settings-payments', label: 'Payments' },
  { id: 'settings-orders', label: 'Orders' },
  { id: 'settings-inventory', label: 'Inventory' },
  { id: 'settings-reviews', label: 'Reviews' },
  { id: 'settings-social', label: 'Social links' },
];

const num = (v, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/** API settings → form values (only editable fields, no undefined). */
export function toSettingsFormValues(s = {}) {
  return {
    storeName: s.storeName ?? '',
    supportEmail: s.supportEmail ?? '',
    supportPhone: s.supportPhone ?? '',
    address: s.address ?? '',
    announcement: s.announcement ?? '',
    freeShippingThreshold: num(s.freeShippingThreshold),
    shippingFee: num(s.shippingFee),
    codEnabled: Boolean(s.codEnabled),
    codFee: num(s.codFee),
    codMaxOrderAmount: num(s.codMaxOrderAmount),
    returnWindowDays: num(s.returnWindowDays, 7),
    reservationTtlMinutes: num(s.reservationTtlMinutes, 30),
    defaultLowStockThreshold: num(s.defaultLowStockThreshold, 5),
    requireReviewModeration: Boolean(s.requireReviewModeration),
    social: Object.fromEntries(SOCIAL_KEYS.map((k) => [k, s.social?.[k] ?? ''])),
  };
}

/** Only the fields the admin changed; `social` is sent as a whole object when any link changed. */
export function buildSettingsPatch(values, dirtyFields = {}) {
  const patch = {};
  for (const [key, dirty] of Object.entries(dirtyFields)) {
    if (key === 'social') {
      if (dirty && Object.values(dirty).some(Boolean)) patch.social = values.social;
    } else if (dirty && key in values) {
      patch[key] = values[key];
    }
  }
  return patch;
}
