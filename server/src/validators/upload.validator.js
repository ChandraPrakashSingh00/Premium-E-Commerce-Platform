import { z } from 'zod';

export const uploadFolderQuery = z.object({ folder: z.enum(['products', 'categories', 'brands']).default('products') });

export const deleteImageSchema = z.object({ publicId: z.string().trim().min(1).max(300) });
