import { z } from 'zod';
import { objectId } from './common.validator.js';

export const addWishlistSchema = z.object({ productId: objectId, variantId: objectId.optional().nullable() });
export const productIdParam = z.object({ productId: objectId });
export const moveToCartSchema = z.object({ variantId: objectId.optional().nullable() });
export const mergeWishlistSchema = z.object({ productIds: z.array(objectId).max(200) });
