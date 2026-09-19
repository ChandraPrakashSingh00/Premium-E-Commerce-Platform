import { z } from 'zod';
import { objectId } from './common.validator.js';

const quantity = z.coerce.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(100);
const couponCode = z.string().trim().min(3).max(30).toUpperCase();

/** Only references and quantities are accepted – any client price fields are stripped. */
const lineInput = z.object({ variantId: objectId, quantity });

export const addItemSchema = lineInput;
export const updateItemSchema = z.object({ quantity });
export const itemIdParam = z.object({ itemId: objectId });
export const mergeCartSchema = z.object({ items: z.array(lineInput).max(50) });
export const applyCouponSchema = z.object({ code: couponCode });
export const previewCartSchema = z.object({
  items: z.array(lineInput).max(50),
  couponCode: couponCode.optional().nullable(),
});
