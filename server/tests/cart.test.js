import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { Coupon, Inventory, Product } from '../src/models/index.js';
import { app, createProduct, createUser, loginAs } from './helpers.js';

const DAY = 24 * 60 * 60 * 1000;

const createCoupon = (overrides = {}) =>
  Coupon.create({
    code: 'SAVE10',
    discountType: 'percentage',
    discountValue: 10,
    startsAt: new Date(Date.now() - DAY),
    expiresAt: new Date(Date.now() + 7 * DAY),
    ...overrides,
  });

describe('cart', () => {
  let user;
  let agent;
  let product;
  let variant;

  beforeEach(async () => {
    user = await createUser();
    agent = await loginAs(user);
    ({ product, variants: [variant] } = await createProduct({ price: 1000, taxRate: 18, variants: [{ stock: 5 }] }));
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/cart');
    expect(res.status).toBe(401);
  });

  it('adds items with server-side pricing and totals', async () => {
    const res = await agent.post('/api/v1/cart/items').send({ variantId: String(variant._id), quantity: 2 });
    expect(res.status).toBe(200);
    const view = res.body.data;
    expect(view.items).toHaveLength(1);
    expect(view.items[0]).toMatchObject({ quantity: 2, price: 1000, lineSubtotal: 2000, issue: null, maxQuantity: 5, stock: 5 });
    expect(view.summary).toMatchObject({ itemCount: 2, subtotal: 2000, tax: 360, shipping: 0, codFee: 0, total: 2360 });
    expect(view.summary.discount).toBe(500); // compareAtPrice 1250
    expect(view.hasIssues).toBe(false);
    expect(view.lines).toBeUndefined();
  });

  it('charges shipping below the free-shipping threshold', async () => {
    const { variants } = await createProduct({ price: 500, taxRate: 0, variants: [{ stock: 5 }] });
    const res = await agent.post('/api/v1/cart/items').send({ variantId: String(variants[0]._id), quantity: 1 });
    expect(res.body.data.summary).toMatchObject({ subtotal: 500, shipping: 79, total: 579, amountToFreeShipping: 499 });
  });

  it('merges quantities and clamps to stock and the per-item maximum', async () => {
    await agent.post('/api/v1/cart/items').send({ variantId: String(variant._id), quantity: 2 });
    const res = await agent.post('/api/v1/cart/items').send({ variantId: String(variant._id), quantity: 4 });
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].quantity).toBe(5);

    await Inventory.updateOne({ variant: variant._id }, { $set: { available: 50 } });
    const up = await agent.patch(`/api/v1/cart/items/${res.body.data.items[0]._id}`).send({ quantity: 60 });
    expect(up.status).toBe(200);
    expect(up.body.data.items[0].quantity).toBe(10);
  });

  it('rejects out-of-stock and unavailable variants', async () => {
    await Inventory.updateOne({ variant: variant._id }, { $set: { available: 0 } });
    const res = await agent.post('/api/v1/cart/items').send({ variantId: String(variant._id), quantity: 1 });
    expect(res.status).toBe(409);

    await Product.updateOne({ _id: product._id }, { $set: { isPublished: false } });
    const res2 = await agent.post('/api/v1/cart/items').send({ variantId: String(variant._id), quantity: 1 });
    expect(res2.status).toBe(404);
  });

  it('flags stock issues on existing lines and excludes unavailable items from totals', async () => {
    const add = await agent.post('/api/v1/cart/items').send({ variantId: String(variant._id), quantity: 3 });
    const itemId = add.body.data.items[0]._id;

    await Inventory.updateOne({ variant: variant._id }, { $set: { available: 1 } });
    let res = await agent.get('/api/v1/cart');
    expect(res.body.data.items[0].issue).toBe('insufficient_stock');
    expect(res.body.data.hasIssues).toBe(true);

    await Inventory.updateOne({ variant: variant._id }, { $set: { available: 0 } });
    res = await agent.get('/api/v1/cart');
    expect(res.body.data.items[0].issue).toBe('out_of_stock');
    expect(res.body.data.summary.subtotal).toBe(0);

    await Inventory.updateOne({ variant: variant._id }, { $set: { available: 5 } });
    await Product.updateOne({ _id: product._id }, { $set: { isPublished: false } });
    res = await agent.get('/api/v1/cart');
    expect(res.body.data.items[0].issue).toBe('unavailable');
    expect(res.body.data.summary.total).toBe(0);

    res = await agent.delete(`/api/v1/cart/items/${itemId}`);
    expect(res.body.data.items).toHaveLength(0);
  });

  it('merges a guest cart after login', async () => {
    await agent.post('/api/v1/cart/items').send({ variantId: String(variant._id), quantity: 1 });
    const { variants: other } = await createProduct({ price: 200, variants: [{ stock: 2 }] });
    const res = await agent.post('/api/v1/cart/merge').send({
      items: [
        { variantId: String(variant._id), quantity: 2 },
        { variantId: String(other[0]._id), quantity: 5 },
      ],
    });
    expect(res.status).toBe(200);
    const byVariant = Object.fromEntries(res.body.data.items.map((i) => [i.variantId, i.quantity]));
    expect(byVariant[String(variant._id)]).toBe(3);
    expect(byVariant[String(other[0]._id)]).toBe(2);
  });

  it('prices guest previews on the server and ignores client prices', async () => {
    const res = await request(app)
      .post('/api/v1/cart/preview')
      .send({ items: [{ variantId: String(variant._id), quantity: 2, price: 1 }], total: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.items[0]).toMatchObject({ _id: String(variant._id), price: 1000, lineSubtotal: 2000 });
    expect(res.body.data.summary.total).toBe(2360);
  });

  it('clears the cart', async () => {
    await agent.post('/api/v1/cart/items').send({ variantId: String(variant._id), quantity: 1 });
    const res = await agent.delete('/api/v1/cart');
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.summary.total).toBe(0);
  });

  describe('coupons', () => {
    beforeEach(async () => {
      await agent.post('/api/v1/cart/items').send({ variantId: String(variant._id), quantity: 2 });
    });

    it('applies a valid coupon and allocates the discount', async () => {
      await createCoupon({ maxDiscount: 150 });
      const res = await agent.post('/api/v1/cart/coupon').send({ code: 'save10' });
      expect(res.status).toBe(200);
      const view = res.body.data;
      expect(view.coupon).toMatchObject({ code: 'SAVE10', discountAmount: 150 });
      // tax on (2000 - 150) = 333; total = 1850 + 333
      expect(view.summary).toMatchObject({ couponDiscount: 150, tax: 333, shipping: 0, total: 2183 });

      const removed = await agent.delete('/api/v1/cart/coupon');
      expect(removed.body.data.coupon).toBeNull();
      expect(removed.body.data.summary.total).toBe(2360);
    });

    it('rejects unknown, expired and below-minimum coupons with 422', async () => {
      let res = await agent.post('/api/v1/cart/coupon').send({ code: 'NOPE' });
      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/invalid/i);

      await createCoupon({ code: 'OLD', startsAt: new Date(Date.now() - 10 * DAY), expiresAt: new Date(Date.now() - DAY) });
      res = await agent.post('/api/v1/cart/coupon').send({ code: 'OLD' });
      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/expired/i);

      await createCoupon({ code: 'BIG', minOrderAmount: 5000 });
      res = await agent.post('/api/v1/cart/coupon').send({ code: 'BIG' });
      expect(res.status).toBe(422);
      expect(res.body.message).toContain('5000');

      const cart = await agent.get('/api/v1/cart');
      expect(cart.body.data.coupon).toBeNull();
    });

    it('drops a coupon that became invalid and reports why', async () => {
      const coupon = await createCoupon();
      await agent.post('/api/v1/cart/coupon').send({ code: 'SAVE10' });
      await Coupon.updateOne({ _id: coupon._id }, { $set: { isActive: false } });

      let res = await agent.get('/api/v1/cart');
      expect(res.body.data.coupon).toBeNull();
      expect(res.body.data.couponError).toMatch(/invalid|no longer active/i);
      expect(res.body.data.summary.couponDiscount).toBe(0);

      res = await agent.get('/api/v1/cart');
      expect(res.body.data.couponError).toBeNull();
    });
  });
});
