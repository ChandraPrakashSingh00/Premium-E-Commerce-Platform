import { z } from 'zod';
import { booleanish, imageInput, objectId, searchText, seoInput } from './common.validator.js';

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may only contain lowercase letters, numbers and hyphens');

const categoryFields = {
  name: z.string().trim().min(2).max(80),
  slug: slugSchema.optional(),
  description: z.string().trim().max(1000).optional(),
  image: imageInput.nullable().optional(),
  parent: objectId.nullable().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional(),
  seo: seoInput,
};

export const createCategorySchema = z.object(categoryFields);

export const updateCategorySchema = z
  .object(categoryFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const adminCategoryQuery = z.object({ q: searchText.optional() });

export const publishSchema = z.object({ isPublished: booleanish });
