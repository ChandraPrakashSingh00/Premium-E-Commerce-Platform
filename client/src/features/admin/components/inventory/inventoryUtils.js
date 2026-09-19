import { z } from 'zod';

/** Mirrors INVENTORY_TXN on the server. */
export const TXN_TYPES = ['RESERVE', 'RELEASE', 'SALE', 'RETURN', 'ADJUSTMENT'];

export const TXN_META = {
  RESERVE: { label: 'Reserved', tone: 'neutral', hint: 'Held for a pending order' },
  RELEASE: { label: 'Released', tone: 'neutral', hint: 'Reservation returned to stock' },
  SALE: { label: 'Sold', tone: 'success', hint: 'Order fulfilled' },
  RETURN: { label: 'Returned', tone: 'warning', hint: 'Returned to stock' },
  ADJUSTMENT: { label: 'Adjustment', tone: 'brand', hint: 'Manual stock change' },
};

export const TXN_OPTIONS = TXN_TYPES.map((value) => ({ value, label: TXN_META[value].label }));

export const STOCK_OPTIONS = [
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

export const ADJUST_MODES = [
  { value: 'increment', label: 'Add', description: 'Receive new stock' },
  { value: 'decrement', label: 'Remove', description: 'Damaged, lost…' },
  { value: 'set', label: 'Set to', description: 'After a stock count' },
];

export const isObjectId = (value) => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

/** Stock after applying an adjustment (NaN-safe). */
export function nextAvailable(available, mode, quantity) {
  const current = Number(available) || 0;
  const qty = Number.isFinite(Number(quantity)) && quantity !== '' ? Math.trunc(Number(quantity)) : 0;
  if (mode === 'set') return qty;
  if (mode === 'decrement') return current - qty;
  return current + qty;
}

const emptyToUndefined = (v) => (v === '' || v === null || v === undefined ? undefined : v);

/** Client mirror of adjustInventorySchema, plus "can't go below zero" for decrements. */
export const makeAdjustSchema = (available = 0) =>
  z
    .object({
      mode: z.enum(['set', 'increment', 'decrement']),
      quantity: z.preprocess(
        emptyToUndefined,
        z.coerce
          .number({ error: 'Enter a quantity' })
          .int('Quantity must be a whole number')
          .min(0, 'Quantity can’t be negative')
          .max(1_000_000, 'Quantity is too large'),
      ),
      reason: z.string().trim().min(3, 'Give a reason for this adjustment').max(300, 'Reason must be at most 300 characters'),
      lowStockThreshold: z.preprocess(
        emptyToUndefined,
        z.coerce.number({ error: 'Enter a number' }).int('Use a whole number').min(0, 'Must be 0 or more').max(100_000, 'Too large').optional(),
      ),
    })
    .superRefine((v, ctx) => {
      if (v.mode !== 'set' && v.quantity < 1) {
        ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'Quantity must be at least 1' });
      }
      if (v.mode === 'decrement' && v.quantity > available) {
        ctx.addIssue({ code: 'custom', path: ['quantity'], message: `Only ${available} available – stock can’t go below 0` });
      }
    });

/** "+5" / "−3" / "0" with a tone for signed transaction quantities. */
export function signedQuantity(quantity) {
  const n = Number(quantity) || 0;
  if (n > 0) return { text: `+${n}`, tone: 'text-success-600', label: `plus ${n}` };
  if (n < 0) return { text: `−${Math.abs(n)}`, tone: 'text-danger-600', label: `minus ${Math.abs(n)}` };
  return { text: '0', tone: 'text-ink-400', label: 'no change' };
}
