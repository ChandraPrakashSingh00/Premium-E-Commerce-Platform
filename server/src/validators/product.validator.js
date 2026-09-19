import mongoose from 'mongoose';
import { z } from 'zod';
import { PRODUCT_SORT } from '../constants/index.js';
import { booleanish, paginationQuery, searchText } from './common.validator.js';

const slugLike = z.string().trim().toLowerCase().max(140).regex(/^[a-z0-9-]*$/, 'Invalid slug');

/** "a,b,c" -> ['a','b','c'] (trimmed, de-duplicated, max `max` entries). */
export const commaList = (max = 20, itemMax = 60) =>
  z
    .string()
    .trim()
    .max(max * (itemMax + 1))
    .transform((v) => [...new Set(v.split(',').map((s) => s.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(itemMax)).max(max));

const idList = commaList(100, 24).refine(
  (ids) => ids.every((id) => /^[a-f\d]{24}$/i.test(id) && mongoose.isValidObjectId(id)),
  'ids must be comma-separated valid ids',
);

const price = z.coerce.number().min(0).max(10_000_000);

export const productListQuery = paginationQuery
  .extend({
    q: searchText.optional(),
    ids: idList.optional(),
    category: slugLike.optional(),
    brand: commaList(30, 140).optional(),
    minPrice: price.optional(),
    maxPrice: price.optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    discount: z.coerce.number().min(0).max(100).optional(),
    inStock: booleanish.optional(),
    size: commaList(20, 20).optional(),
    color: commaList(20, 40).optional(),
    sort: z.enum(Object.keys(PRODUCT_SORT)).optional(),
    featured: booleanish.optional(),
    bestSeller: booleanish.optional(),
    newArrival: booleanish.optional(),
  })
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    message: 'minPrice cannot be greater than maxPrice',
    path: ['minPrice'],
  });

export const productFiltersQuery = z.object({
  category: slugLike.optional(),
  q: searchText.optional(),
});

export const suggestionsQuery = z.object({ q: z.string().trim().min(2, 'Type at least 2 characters').max(100) });

export const relatedQuery = z.object({ limit: z.coerce.number().int().min(1).max(24).default(8) });
