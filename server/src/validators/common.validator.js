import mongoose from 'mongoose';
import { z } from 'zod';
import { PAGINATION } from '../constants/index.js';

export const objectId = z
  .string()
  .trim()
  .refine((v) => mongoose.isValidObjectId(v) && /^[a-f\d]{24}$/i.test(v), 'Invalid id');

export const idParam = z.object({ id: objectId });
export const slugParam = z.object({ slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9-]+$/, 'Invalid slug') });

/** "true"/"false"/"1"/"0" query flags. */
export const booleanish = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1');

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(PAGINATION.MAX_LIMIT).default(PAGINATION.DEFAULT_LIMIT),
});

export const searchText = z.string().trim().max(100);

export const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(254);

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number');

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{10,15}$/, 'Enter a valid phone number');

export const imageInput = z.object({
  url: z.string().trim().url().max(1000),
  publicId: z.string().trim().max(300).optional(),
  alt: z.string().trim().max(200).optional().default(''),
});

export const seoInput = z
  .object({
    title: z.string().trim().max(70).optional(),
    description: z.string().trim().max(170).optional(),
    keywords: z.array(z.string().trim().max(50)).max(20).optional(),
    canonicalUrl: z.string().trim().max(500).optional(),
  })
  .optional();

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const STORE_TZ_OFFSET = '+05:30';

/** Range start: a bare YYYY-MM-DD means the start of that day in store time (IST). */
export const dateFrom = z.preprocess(
  (v) => (typeof v === 'string' && DATE_ONLY.test(v) ? `${v}T00:00:00.000${STORE_TZ_OFFSET}` : v),
  z.coerce.date(),
);

/** Range end: a bare YYYY-MM-DD means the end of that day in store time (IST). */
export const dateTo = z.preprocess(
  (v) => (typeof v === 'string' && DATE_ONLY.test(v) ? `${v}T23:59:59.999${STORE_TZ_OFFSET}` : v),
  z.coerce.date(),
);
