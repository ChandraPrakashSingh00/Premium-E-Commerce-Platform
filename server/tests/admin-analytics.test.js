import { describe, expect, it } from 'vitest';
import { Inventory, Order } from '../src/models/index.js';
import { createAdmin, createProduct, createUser, loginAs } from './helpers.js';

const DAY = 86_400_000;
let seq = 0;

function buildOrder(user, lines, overrides = {}) {
  seq += 1;
  const items = lines.map(({ product, variant, quantity, price }) => ({
    product: product._id,
    variant: variant._id,
    name: product.name,
    slug: product.slug,
    image: product.thumbnail,
    sku: variant.sku,
    price,
    quantity,
    lineSubtotal: price * quantity,
    lineTotal: price * quantity,
  }));
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  return {
    orderNumber: `ORD-2026-${String(seq).padStart(6, '0')}`,
    user: user._id,
    items,
    contact: { name: user.name, email: user.email, phone: '9876543210' },
    shippingAddress: {
      fullName: user.name,
      phone: '9876543210',
      addressLine1: '1 Test Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600001',
      country: 'India',
    },
    pricing: { subtotal, total: subtotal },
    paymentMethod: 'razorpay',
    ...overrides,
  };
}

describe('admin dashboard analytics', () => {
  it('computes revenue, cards, series and top lists from real orders', async () => {
    const admin = await createAdmin();
    const customer = await createUser();
    const shoe = await createProduct({ name: 'Runner Shoe', variants: [{ stock: 3 }] });
    const bag = await createProduct({ name: 'Leather Bag', variants: [{ stock: 50 }] });
    await Inventory.updateOne({ variant: shoe.variants[0]._id }, { $set: { lowStockThreshold: 5 } });

    const shoeLine = (quantity) => ({ product: shoe.product, variant: shoe.variants[0], quantity, price: 1000 });
    const bagLine = (quantity) => ({ product: bag.product, variant: bag.variants[0], quantity, price: 2500 });
    const now = Date.now();

    await Order.create([
      // Paid online: 2000 + 2500 = 4500
      buildOrder(customer, [shoeLine(2), bagLine(1)], { paymentStatus: 'paid', status: 'confirmed' }),
      // Partially refunded: 5000 - 1000 = 4000
      buildOrder(customer, [bagLine(2)], {
        paymentStatus: 'partially_refunded',
        status: 'delivered',
        refund: { status: 'processed', amount: 1000 },
      }),
      // Delivered COD awaiting reconciliation: 1000
      buildOrder(customer, [shoeLine(1)], { paymentMethod: 'cod', paymentStatus: 'pending', status: 'delivered' }),
      // Not revenue: unpaid, cancelled, refunded
      buildOrder(customer, [shoeLine(5)], { paymentStatus: 'pending', status: 'pending' }),
      buildOrder(customer, [bagLine(3)], { paymentStatus: 'paid', status: 'cancelled' }),
      buildOrder(customer, [bagLine(4)], { paymentStatus: 'refunded', status: 'refunded' }),
    ]);
    // Previous period (7d range → 7..13 days ago): 3000 paid.
    const [old] = await Order.create([buildOrder(customer, [shoeLine(3)], { paymentStatus: 'paid', status: 'delivered' })]);
    await Order.collection.updateOne({ _id: old._id }, { $set: { createdAt: new Date(now - 9 * DAY) } });

    const agent = await loginAs(admin);
    const res = await agent.get('/api/v1/admin/dashboard').query({ range: '7d' });
    expect(res.status).toBe(200);
    const d = res.body.data;

    expect(d.cards.revenue).toMatchObject({ value: 9500, previous: 3000, change: 216.7 });
    expect(d.cards.orders).toMatchObject({ value: 6, previous: 1, change: 500 });
    expect(d.cards.customers).toMatchObject({ value: 1, total: 1, change: null });
    expect(d.cards.products.value).toBe(2);
    expect(d.cards.lowStock.value).toBe(1);
    expect(d.cards.pendingOrders.value).toBe(2);

    expect(d.revenueSeries).toHaveLength(7);
    expect(d.revenueSeries.reduce((s, p) => s + p.revenue, 0)).toBe(9500);
    expect(d.revenueSeries.at(-1)).toMatchObject({ revenue: 9500, orders: 6 });
    expect(d.revenueSeries[0]).toMatchObject({ revenue: 0, orders: 0 });
    expect(d.revenueSeries.at(-1).date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(d.customerSeries.reduce((s, p) => s + p.customers, 0)).toBe(1);

    const statuses = Object.fromEntries(d.orderStatusBreakdown.map((s) => [s.status, s.count]));
    expect(statuses).toEqual({ delivered: 2, confirmed: 1, pending: 1, cancelled: 1, refunded: 1 });

    // Item revenue counts only revenue orders: bag 2500 + 5000, shoe 2000 + 1000.
    expect(d.topProducts).toEqual([
      expect.objectContaining({ productId: String(bag.product._id), name: 'Leather Bag', quantity: 3, revenue: 7500 }),
      expect.objectContaining({ productId: String(shoe.product._id), name: 'Runner Shoe', quantity: 3, revenue: 3000 }),
    ]);
    expect(d.topCategories).toEqual([
      { categoryId: String(bag.category._id), name: bag.category.name, quantity: 3, revenue: 7500 },
      { categoryId: String(shoe.category._id), name: shoe.category.name, quantity: 3, revenue: 3000 },
    ]);

    expect(d.recentOrders).toHaveLength(7);
    expect(d.recentOrders[0].customer).toMatchObject({ name: customer.name, email: customer.email });
    expect(d.recentOrders[0]).toHaveProperty('orderNumber');
  });

  it('returns analytics for a custom range', async () => {
    const admin = await createAdmin();
    const customer = await createUser();
    const shoe = await createProduct({ name: 'Trail Shoe' });
    const line = { product: shoe.product, variant: shoe.variants[0], quantity: 2, price: 750 };
    await Order.create([
      buildOrder(customer, [line], { paymentStatus: 'paid', status: 'shipped' }),
      buildOrder(customer, [line], { paymentMethod: 'cod', paymentStatus: 'pending', status: 'confirmed' }),
      buildOrder(customer, [line], { paymentStatus: 'refunded', status: 'refunded', refund: { status: 'processed', amount: 1500 } }),
    ]);

    const agent = await loginAs(admin);
    const today = new Date().toISOString();
    const from = new Date(Date.now() - 20 * DAY).toISOString();
    const res = await agent.get('/api/v1/admin/analytics').query({ from, to: today, granularity: 'week' });
    expect(res.status).toBe(200);
    const a = res.body.data;
    expect(a.summary).toEqual({ revenue: 1500, orders: 3, avgOrderValue: 1500, newCustomers: 1, refunded: 1500, itemsSold: 2 });
    expect(a.series.reduce((s, p) => s + p.orders, 0)).toBe(3);
    expect(a.series.reduce((s, p) => s + p.customers, 0)).toBe(1);
    expect(a.series.length).toBeGreaterThanOrEqual(3);
    expect(a.paymentMethods).toEqual([
      { method: 'razorpay', count: 2, revenue: 1500 },
      { method: 'cod', count: 1, revenue: 0 },
    ]);
    expect(a.topBrands).toEqual([{ brandId: String(shoe.brand._id), name: shoe.brand.name, quantity: 2, revenue: 1500 }]);

    const bad = await agent.get('/api/v1/admin/analytics').query({ from: today, to: from });
    expect(bad.status).toBe(422);
    const tooLong = await agent.get('/api/v1/admin/analytics').query({ from: '2020-01-01', to: today, granularity: 'day' });
    expect(tooLong.status).toBe(400);
  });
});
