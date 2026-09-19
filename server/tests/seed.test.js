import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, loginAs } from './helpers.js';
import {
  Address,
  Brand,
  Category,
  Counter,
  Coupon,
  Inventory,
  InventoryTransaction,
  Order,
  Product,
  ProductVariant,
  Review,
  User,
} from '../src/models/index.js';
import { runSeed } from '../scripts/seed-runner.js';

describe('seed', () => {
  it('loads a consistent demo store', async () => {
    const { counts, credentials } = await runSeed();

    expect(counts.products).toBeGreaterThanOrEqual(36);
    expect(await Product.countDocuments({ isPublished: true })).toBe(counts.products);
    expect(await Category.countDocuments({ parent: null })).toBeGreaterThanOrEqual(8);
    expect(await Category.countDocuments({ parent: { $ne: null } })).toBeGreaterThan(0);
    expect(await Brand.countDocuments()).toBeGreaterThanOrEqual(10);
    expect(await Review.countDocuments({ status: 'approved', isVerifiedPurchase: true })).toBeGreaterThanOrEqual(20);
    expect(await Coupon.countDocuments()).toBe(4);

    // Every variant has inventory; product aggregates match inventory.
    const variantCount = await ProductVariant.countDocuments();
    expect(await Inventory.countDocuments()).toBe(variantCount);
    const [stock] = await Inventory.aggregate([{ $group: { _id: null, available: { $sum: '$available' }, sold: { $sum: '$sold' }, reserved: { $sum: '$reserved' } } }]);
    const [productStock] = await Product.aggregate([{ $group: { _id: null, stock: { $sum: '$stock' } } }]);
    expect(productStock.stock).toBe(stock.available);
    expect(stock.reserved).toBe(0);
    expect(await InventoryTransaction.countDocuments({ type: 'ADJUSTMENT', reason: 'Initial stock' })).toBeGreaterThan(0);

    // Orders: sequential numbers, counter in sync, sold units match inventory.
    const orders = await Order.find().sort({ orderNumber: 1 }).lean();
    const year = new Date().getFullYear();
    expect(orders[0].orderNumber).toBe(`ORD-${year}-000001`);
    expect((await Counter.findById(`order-${year}`)).seq).toBe(orders.length);
    expect(orders.every((o) => o.inventoryState === 'committed')).toBe(true);
    const unitsSold = orders.flatMap((o) => o.items).reduce((s, i) => s + i.quantity, 0);
    expect(stock.sold).toBe(unitsSold);
    const delivered = orders.filter((o) => o.status === 'delivered');
    expect(delivered.length).toBeGreaterThanOrEqual(3);
    expect(delivered.every((o) => o.paymentStatus === 'paid')).toBe(true);

    // Reviews are verified purchases and ratings were recalculated.
    const review = await Review.findOne().lean();
    const order = await Order.findById(review.order).lean();
    expect(order.status).toBe('delivered');
    expect(order.items.find((i) => String(i.product) === String(review.product)).isReviewed).toBe(true);
    const reviewed = await Product.findById(review.product).lean();
    expect(reviewed.reviewCount).toBeGreaterThan(0);
    expect(reviewed.ratingAverage).toBeGreaterThan(0);

    // Accounts work and the customer has a default address.
    const admin = await User.findOne({ email: credentials.admin.email }).lean();
    expect(admin).toMatchObject({ role: 'ADMIN', isEmailVerified: true });
    const customer = await User.findOne({ email: credentials.customer.email }).lean();
    expect(await Address.exists({ user: customer._id, isDefault: true })).toBeTruthy();
    await loginAs(admin, credentials.admin.password);

    // Storefront endpoints work on the seeded data.
    const api = request(app);
    const home = await api.get('/api/v1/products/home');
    expect(home.body.data.featured.length).toBeGreaterThan(0);
    expect(home.body.data.trending).toHaveLength(8);
    const tree = await api.get('/api/v1/categories');
    expect(tree.body.data.every((c) => c.productCount > 0)).toBe(true);
    const detail = await api.get(`/api/v1/products/${reviewed.slug}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.breadcrumbs.length).toBeGreaterThan(0);
  }, 120_000);
});
