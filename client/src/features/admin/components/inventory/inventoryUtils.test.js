import { makeAdjustSchema, nextAvailable, signedQuantity } from './inventoryUtils';
import { brandFormSchema, brandDefaults, toCategoryPayload, categoryDefaults, categoryFormSchema } from '../catalog/schemas';

describe('adjust schema', () => {
  const schema = makeAdjustSchema(5);
  const base = { mode: 'increment', quantity: '3', reason: 'Restock', lowStockThreshold: '' };

  it('coerces and drops an empty threshold', () => {
    const r = schema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ mode: 'increment', quantity: 3, reason: 'Restock' });
  });

  it('requires a quantity (also for set) and >= 1 unless set', () => {
    expect(schema.safeParse({ ...base, mode: 'set', quantity: '' }).success).toBe(false);
    expect(schema.safeParse({ ...base, mode: 'set', quantity: '0' }).success).toBe(true);
    expect(schema.safeParse({ ...base, quantity: '0' }).success).toBe(false);
  });

  it('blocks decrements below zero and short reasons', () => {
    expect(schema.safeParse({ ...base, mode: 'decrement', quantity: '6' }).success).toBe(false);
    expect(schema.safeParse({ ...base, mode: 'decrement', quantity: '5' }).success).toBe(true);
    expect(schema.safeParse({ ...base, reason: 'ok' }).success).toBe(false);
  });

  it('previews and formats', () => {
    expect(nextAvailable(12, 'increment', '5')).toBe(17);
    expect(nextAvailable(12, 'decrement', 13)).toBe(-1);
    expect(nextAvailable(12, 'set', '')).toBe(0);
    expect(signedQuantity(-2).text).toBe('−2');
    expect(signedQuantity(4).text).toBe('+4');
  });
});

describe('catalog schemas', () => {
  it('builds a category payload', () => {
    const values = categoryFormSchema.parse({ ...categoryDefaults(), name: 'Shirts', sortOrder: '3', seo: { title: '', description: '', keywords: 'a, b,,' } });
    expect(toCategoryPayload(values)).toMatchObject({ name: 'Shirts', slug: undefined, image: null, parent: null, sortOrder: 3, seo: { keywords: ['a', 'b'] } });
  });

  it('validates slug and website', () => {
    expect(categoryFormSchema.safeParse({ ...categoryDefaults(), name: 'Shirts', slug: 'Bad slug' }).success).toBe(false);
    expect(brandFormSchema.safeParse({ ...brandDefaults(), name: 'Nike', website: 'nike' }).success).toBe(false);
    expect(brandFormSchema.safeParse({ ...brandDefaults(), name: 'Nike', website: 'https://nike.com' }).success).toBe(true);
  });
});
