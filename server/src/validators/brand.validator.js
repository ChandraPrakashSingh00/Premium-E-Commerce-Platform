import { z } from 'zod';
import { imageInput, searchText, seoInput } from './common.validator.js';
import { slugSchema } from './category.validator.js';

const brandFields = {
  name: z.string().trim().min(2).max(80),
  slug: slugSchema.optional(),
  description: z.string().trim().max(1000).optional(),
  logo: imageInput.nullable().optional(),
  website: z.union([z.string().trim().url().max(300), z.literal('')]).optional(),
  isPublished: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seo: seoInput,
};

export const createBrandSchema = z.object(brandFields);

export const updateBrandSchema = z
  .object(brandFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const adminBrandQuery = z.object({ q: searchText.optional() });

export { publishSchema } from './category.validator.js';
