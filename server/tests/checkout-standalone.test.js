import { describe, expect, it, vi } from 'vitest';
import { Coupon, CouponUsage, Inventory, InventoryTransaction, Order } from '../src/models/index.js';
import { addToCart, createCoupon, placeOrder } from './commerceHelpers.js';
import { createAddress, createProduct, createUser, loginAs } from './helpers.js';

// Simulate a standalone MongoDB (no multi-document transactions): correctness must
// come from conditional updates plus explicit compensation.
vi.mock('../src/utils/transaction.js', () => ({ withTransaction: (fn) => fn(null) }));

async function shopper(variantId, qty = 1) {
  const user = await createUser();
  const agent = await loginAs(user);
  const address = await createAddress(user);
  await addToCart(agent, variantId, qty);
  return { user, agent, address };
}

const stockOf = (variantId) => Inventory.findOne({ variant: variantId }).lean();

describe('checkout without transactions', () => {
  it('never oversells the last unit', async () => {
    const { variants } = await createProduct({ variants: [{ stock: 1 }] });
    const buyers = await Promise.all([1, 2, 3].map(() => shopper(variants[0]._id)));
    const results = await Promise.all(buyers.map((b) => placeOrder(b.agent, b)));
    expect(results.map((r) => r.status).sort()).toEqual([201, 409, 409]);
    expect(await Order.countDocuments()).toBe(1);
    expect(await stockOf(variants[0]._id)).toMatchObject({ available: 0, reserved: 0, sold: 1 });
    expect(await InventoryTransaction.countDocuments({ type: 'RESERVE' })).toBe(1);
  });

  it('undoes the reservation and the order when the coupon runs out mid-checkout', async () => {
    const { variants } = await createProduct({ variants: [{ stock: 5 }] });
    const coupon = await createCoupon({ usageLimit: 1 });
    const buyers = await Promise.all([1, 2].map(() => shopper(variants[0]._id, 2)));
    for (const b of buyers) {
      expect((await b.agent.post('/api/v1/cart/coupon').send({ code: 'FLAT100' })).status).toBe(200);
    }
    const results = await Promise.all(buyers.map((b) => placeOrder(b.agent, b)));
    expect(results.map((r) => r.status).sort()).toEqual([201, 422]);
    expect(await Order.countDocuments()).toBe(1);
    expect(await stockOf(variants[0]._id)).toMatchObject({ available: 3, reserved: 0, sold: 2 });
    expect((await Coupon.findById(coupon._id)).usedCount).toBe(1);
    expect(await CouponUsage.countDocuments()).toBe(1);
  });

  it('cancels and restocks without transactions', async () => {
    const { variants } = await createProduct({ variants: [{ stock: 4 }] });
    const b = await shopper(variants[0]._id, 3);
    const placed = await placeOrder(b.agent, b);
    expect(placed.status).toBe(201);
    const res = await b.agent.post(`/api/v1/orders/${placed.body.data.order._id}/cancel`).send({ reason: 'Changed mind' });
    expect(res.status).toBe(200);
    expect(await stockOf(variants[0]._id)).toMatchObject({ available: 4, reserved: 0, sold: 0 });
  });
});
