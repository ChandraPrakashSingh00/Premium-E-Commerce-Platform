import { z } from 'zod';
import { booleanish, imageInput, objectId, paginationQuery, searchText, seoInput } from './common.validator.js';
import { slugSchema } from './category.validator.js';

const sku = z
  .string()
  .trim()
  .toUpperCase()
  .min(2)
  .max(60)
  .regex(/^[A-Z0-9][A-Z0-9_-]*$/, 'SKU may only contain letters, numbers, - and _');
const money = z.coerce.number().min(0).max(10_000_000).transform((n) => Math.round(n * 100) / 100);
const stock = z.coerce.number().int().min(0).max(1_000_000);
const hex = z.string().trim().regex(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i, 'Invalid colour hex');

export const variantInput = z.object({
  _id: objectId.optional(),
  sku,
  size: z.string().trim().max(20).optional(),
  color: z.string().trim().max(40).optional(),
  colorHex: z.union([hex, z.literal('')]).optional(),
  price: money,
  compareAtPrice: money.optional(),
  images: z.array(imageInput).max(10).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  stock: stock.optional(),
});

const productFields = {
  name: z.string().trim().min(2).max(160),
  slug: slugSchema.optional(),
  shortDescription: z.string().trim().max(300).optional(),
  description: z.string().trim().max(10000).optional(),
  images: z.array(imageInput).max(10).default([]),
  category: objectId,
  subcategory: objectId.nullable().optional(),
  brand: objectId,
  sku,
  price: money,
  compareAtPrice: money.optional(),
  taxRate: z.coerce.number().min(0).max(40).optional(),
  attributes: z
    .array(z.object({ name: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(300) }))
    .max(50)
    .optional(),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(30).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  shippingInfo: z.string().trim().max(1000).optional(),
  returnPolicy: z.string().trim().max(1000).optional(),
  seo: seoInput,
  lowStockThreshold: z.coerce.number().int().min(0).max(100_000).optional(),
  stock: stock.optional(),
  variants: z.array(variantInput).max(100).optional(),
};

/** Cross-field checks shared by create and update. */
function checkProduct(v, ctx) {
  if (v.compareAtPrice && v.price !== undefined && v.compareAtPrice < v.price) {
    ctx.addIssue({ code: 'custom', path: ['compareAtPrice'], message: 'Compare-at price must be at least the selling price' });
  }
  if (!v.variants) return;
  const skus = new Set();
  const combos = new Set();
  v.variants.forEach((variant, i) => {
    if (skus.has(variant.sku)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'sku'], message: 'Duplicate variant SKU' });
    skus.add(variant.sku);
    const combo = `${(variant.size ?? '').toLowerCase()}|${(variant.color ?? '').toLowerCase()}`;
    if (combos.has(combo)) {
      ctx.addIssue({ code: 'custom', path: ['variants', i], message: 'Duplicate size/colour combination' });
    }
    combos.add(combo);
    if (variant.compareAtPrice && variant.compareAtPrice < variant.price) {
      ctx.addIssue({ code: 'custom', path: ['variants', i, 'compareAtPrice'], message: 'Compare-at price must be at least the price' });
    }
  });
  if (v.variants.length && !v.variants.some((variant) => variant.isActive !== false)) {
    ctx.addIssue({ code: 'custom', path: ['variants'], message: 'At least one variant must be active' });
  }
}

export const createProductSchema = z.object(productFields).superRefine(checkProduct);

export const updateProductSchema = z
  .object(productFields)
  .partial()
  .extend({ images: z.array(imageInput).max(10).optional() })
  .superRefine((v, ctx) => {
    if (!Object.keys(v).length) ctx.addIssue({ code: 'custom', message: 'Provide at least one field to update' });
    checkProduct(v, ctx);
  });

export const adminProductListQuery = paginationQuery.extend({
  q: searchText.optional(),
  category: z.string().trim().max(140).optional(),
  brand: z.string().trim().max(140).optional(),
  status: z.enum(['published', 'draft']).optional(),
  stock: z.enum(['in', 'low', 'out']).optional(),
  sort: z.enum(['newest', 'name', 'price-low', 'price-high', 'stock']).default('newest'),
});

export const publishProductSchema = z.object({ isPublished: booleanish });
