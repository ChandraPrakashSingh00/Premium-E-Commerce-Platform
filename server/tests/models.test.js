import { describe, expect, it } from 'vitest';
import { Product, ProductVariant, User, Order } from '../src/models/index.js';
import { withTransaction } from '../src/utils/transaction.js';
import { supportsTransactions } from '../src/config/db.js';

describe('models', () => {
  it('hashes passwords and hides sensitive fields', async () => {
    const user = await User.create({ name: 'Asha', email: 'ASHA@example.com', password: 'Secret123' });
    const fromDb = await User.findById(user._id).select('+password');
    expect(fromDb.password).not.toBe('Secret123');
    expect(await fromDb.comparePassword('Secret123')).toBe(true);
    expect(fromDb.toJSON().password).toBeUndefined();
    expect(fromDb.email).toBe('asha@example.com');
  });

  it('computes product discount and supports transactions', async () => {
    expect(supportsTransactions()).toBe(true);
    const p = await withTransaction(async (session) => {
      const [doc] = await Product.create(
        [{ name: 'Tee', slug: 'tee', sku: 'tee-1', price: 750, compareAtPrice: 1000, category: User.base.Types.ObjectId.createFromTime(1), brand: User.base.Types.ObjectId.createFromTime(2) }],
        { session },
      );
      await ProductVariant.create([{ product: doc._id, sku: 'tee-1-m', price: 750, size: 'M' }], { session });
      return doc;
    });
    expect(p.discount).toBe(25);
    expect(p.sku).toBe('TEE-1');
    const v = await ProductVariant.findOne({ product: p._id });
    expect(v.title).toBe('M');
    expect(await Order.countDocuments()).toBe(0);
  });
});
