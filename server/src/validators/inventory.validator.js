import { z } from 'zod';
import { INVENTORY_TXN } from '../constants/index.js';
import { objectId, paginationQuery, searchText } from './common.validator.js';

export const listInventoryQuery = paginationQuery.extend({
  q: searchText.optional(),
  status: z.enum(['in', 'low', 'out']).optional(),
});

export const adjustInventorySchema = z
  .object({
    mode: z.enum(['set', 'increment', 'decrement']),
    quantity: z.coerce.number().int('Quantity must be a whole number').min(0).max(1_000_000),
    reason: z.string().trim().min(3, 'Give a reason for this adjustment').max(300),
    lowStockThreshold: z.coerce.number().int().min(0).max(100_000).optional(),
  })
  .refine((v) => v.mode === 'set' || v.quantity > 0, { path: ['quantity'], message: 'Quantity must be at least 1' });

export const listTransactionsQuery = paginationQuery.extend({
  type: z.enum(Object.values(INVENTORY_TXN)).optional(),
  inventoryId: objectId.optional(),
  productId: objectId.optional(),
});
