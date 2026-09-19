import { z } from 'zod';
import { paginationQuery, phone } from './common.validator.js';

const atLeastOne = (v) => Object.values(v).some((x) => x !== undefined);

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long').optional(),
    // Empty string clears the value.
    phone: z.union([phone, z.literal('')]).optional(),
    avatar: z.union([z.string().trim().url('Enter a valid image URL').max(1000), z.literal('')]).optional(),
  })
  .refine(atLeastOne, 'Nothing to update');

export const updatePreferencesSchema = z
  .object({
    newsletter: z.boolean().optional(),
    orderUpdates: z.boolean().optional(),
    promotions: z.boolean().optional(),
  })
  .refine(atLeastOne, 'Nothing to update');

export const myReviewsQuery = paginationQuery;
