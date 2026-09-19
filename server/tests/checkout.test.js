import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  Cart,
  Coupon,
  CouponUsage,
  Inventory,
  InventoryTransaction,
  Order,
  Payment,
  Product,
} from '../src/models/index.js';
import { inventoryService } from '../src/services/inventory.service.js';
import { settingsService } from '../src/services/settings.service.js';
import { AppError } from '../src/utils/AppError.js';
import { withTransaction } from '../src/utils/transaction.js';
import { addToCart, createCoupon, placeOrder, setupShopper } from './commerceHelpers.js';
import { createAddress, createProduct, createUser, loginAs } from './helpers.js';

const mocks = vi.hoisted(() => ({
  createOrder: vi.fn(),
  fetchPayment: vi.fn(),
  fetchOrderPayments: vi.fn(),
  refund: vi.fn(),
}));
vi.mock('../src/integrations/razorpay.js', async (importOriginal) => {
  const actual = await importOriginal();
  return { razorpay: { ...actual.razorpay, ...mocks } };
});

let gatewaySeq = 0;
beforeEach(() => {
  vi.clearAllMocks();
  mocks.createOrder.mockImplementation(async ({ amountPaise }) => {
    gatewaySeq += 1;
    return { id: `order_TEST${gatewaySeq}`, amount: amountPaise, status: 'created' };
  });
  mocks.refund.mockImplementation(async ({ amountPaise }) => ({ id: `rfnd_${gatewaySeq}`, amount: amountPaise, status: 'processed' }));
  mocks.fetchOrderPayments.mockResolvedValue([]);
});

const stockOf = (variantId) => Inventory.findOne({ variant: variantId }).lean();

describe('checkout – cash on delivery', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await setupShopper({ stock: 5, price: 1000 });
  });

  it('creates a confirmed order, commits stock, clears the cart and records the coupon', async () => {
    const coupon = await createCoupon();
    await addToCart(ctx.agent, ctx.variant._id, 2);
    await ctx.agent.post('/api/v1/cart/coupon').send({ code: 'FLAT100' });

    const res = await placeOrder(ctx.agent, ctx);
    expect(res.status).toBe(201);
    const { order, payment } = res.body.data;
    expect(payment).toBeNull();
    expect(order.orderNumber).toMatch(/^ORD-\d{4}-\d{6}$/);
    expect(order).toMatchObject({ status: 'confirmed', paymentStatus: 'pending', paymentMethod: 'cod', canCancel: true });
    expect(order.pricing).toMatchObject({ subtotal: 2000, couponDiscount: 100, tax: 342, shipping: 0, total: 2242 });
    expect(order.items[0]).toMatchObject({ quantity: 2, price: 1000, discountAmount: 100, taxAmount: 342, lineTotal: 2242 });
    expect(order.coupon).toEqual({ code: 'FLAT100' });
    expect(order.idempotencyKey).toBeUndefined();
    expect(order.statusHistory.map((h) => h.status)).toEqual(['pending', 'confirmed']);

    const inv = await stockOf(ctx.variant._id);
    expect(inv).toMatchObject({ available: 3, reserved: 0, sold: 2 });
    expect((await Product.findById(ctx.product._id)).soldCount).toBe(2);
    const txns = await InventoryTransaction.find({ order: order._id }).lean();
    expect(txns.map((t) => t.type).sort()).toEqual(['RESERVE', 'SALE']);

    const cart = await Cart.findOne({ user: ctx.user._id }).lean();
    expect(cart.items).toHaveLength(0);
    expect(cart.couponCode).toBeNull();

    expect(await CouponUsage.countDocuments({ coupon: coupon._id, order: order._id })).toBe(1);
    expect((await Coupon.findById(coupon._id)).usedCount).toBe(1);

    const dbOrder = await Order.findById(order._id).lean();
    expect(dbOrder.inventoryState).toBe('committed');
    expect(dbOrder.notificationsSent).toContain('placed');
    const pay = await Payment.findOne({ order: order._id }).lean();
    expect(pay).toMatchObject({ method: 'cod', status: 'created', amount: 2242 });
  });

  it('returns the same order for a repeated idempotency key (sequential and concurrent)', async () => {
    await addToCart(ctx.agent, ctx.variant._id, 2);
    const key = crypto.randomUUID();
    const [a, b] = await Promise.all([placeOrder(ctx.agent, { ...ctx, key }), placeOrder(ctx.agent, { ...ctx, key })]);
    expect([a.status, b.status].sort()).toEqual([200, 201]);
    expect(a.body.data.order._id).toBe(b.body.data.order._id);

    const again = await placeOrder(ctx.agent, { ...ctx, key });
    expect(again.status).toBe(200);
    expect(again.body.data.order._id).toBe(a.body.data.order._id);

    expect(await Order.countDocuments()).toBe(1);
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 3, sold: 2 });
    expect(await InventoryTransaction.countDocuments({ type: 'RESERVE' })).toBe(1);
  });

  it('rejects carts with stock issues without reserving anything', async () => {
    await addToCart(ctx.agent, ctx.variant._id, 3);
    await Inventory.updateOne({ variant: ctx.variant._id }, { $set: { available: 2 } });
    const res = await placeOrder(ctx.agent, ctx);
    expect(res.status).toBe(409);
    expect(res.body.errors[0].message).toMatch(/insufficient stock/);
    expect(await Order.countDocuments()).toBe(0);
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 2, reserved: 0 });
    expect(await InventoryTransaction.countDocuments()).toBe(0);
  });

  it('validates the request: key, empty cart, address ownership and COD rules', async () => {
    let res = await ctx.agent.post('/api/v1/orders').send({});
    expect(res.status).toBe(422);

    res = await placeOrder(ctx.agent, ctx);
    expect(res.status).toBe(409);

    await addToCart(ctx.agent, ctx.variant._id, 1);
    const stranger = await createUser();
    const foreign = await createAddress(stranger);
    res = await placeOrder(ctx.agent, { ...ctx, address: foreign });
    expect(res.status).toBe(404);

    await settingsService.update({ codMaxOrderAmount: 500 });
    res = await placeOrder(ctx.agent, ctx);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/up to ₹500/);

    const quote = await ctx.agent.post('/api/v1/orders/quote').send({ paymentMethod: 'cod' });
    expect(quote.body.data).toMatchObject({ codAvailable: false });

    await settingsService.update({ codEnabled: false, codMaxOrderAmount: 50000 });
    res = await placeOrder(ctx.agent, ctx);
    expect(res.status).toBe(400);
    expect(await Order.countDocuments()).toBe(0);
  });

  it('applies the COD fee in quotes and orders', async () => {
    await settingsService.update({ codFee: 49 });
    await addToCart(ctx.agent, ctx.variant._id, 1);
    const quote = await ctx.agent.post('/api/v1/orders/quote').send({ paymentMethod: 'cod' });
    expect(quote.body.data.summary).toMatchObject({ codFee: 49, total: 1229 });
    expect(quote.body.data.codAvailable).toBe(true);
    const res = await placeOrder(ctx.agent, ctx);
    expect(res.body.data.order.pricing).toMatchObject({ codFee: 49, total: 1229 });
  });

  it('cancelling a COD order returns committed stock', async () => {
    await addToCart(ctx.agent, ctx.variant._id, 2);
    const { body } = await placeOrder(ctx.agent, ctx);
    const res = await ctx.agent.post(`/api/v1/orders/${body.data.order._id}/cancel`).send({ reason: 'Changed my mind' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'cancelled', canCancel: false });
    expect(res.body.data.cancellation).toMatchObject({ cancelledBy: 'customer', reason: 'Changed my mind' });
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 5, reserved: 0, sold: 0 });
    expect((await Product.findById(ctx.product._id)).soldCount).toBe(0);

    const again = await ctx.agent.post(`/api/v1/orders/${body.data.order._id}/cancel`).send({ reason: 'again' });
    expect(again.status).toBe(409);
  });

  it('only lets customers see and cancel their own, still-cancellable orders', async () => {
    await addToCart(ctx.agent, ctx.variant._id, 1);
    const { body } = await placeOrder(ctx.agent, ctx);
    const id = body.data.order._id;

    const list = await ctx.agent.get('/api/v1/orders');
    expect(list.body.data.items).toHaveLength(1);
    expect(list.body.data.items[0]).toMatchObject({ _id: id, itemCount: 1 });
    expect(list.body.data.items[0].items[0]).toHaveProperty('name');

    const other = await loginAs(await createUser());
    expect((await other.get(`/api/v1/orders/${id}`)).status).toBe(404);
    expect((await other.post(`/api/v1/orders/${id}/cancel`).send({ reason: 'not mine' })).status).toBe(404);

    await Order.updateOne({ _id: id }, { $set: { status: 'shipped' } });
    const res = await ctx.agent.post(`/api/v1/orders/${id}/cancel`).send({ reason: 'too late' });
    expect(res.status).toBe(409);
  });
});

describe('checkout – concurrency', () => {
  it('sells the last unit to exactly one of two concurrent shoppers', async () => {
    const { variants } = await createProduct({ price: 1500, variants: [{ stock: 1 }] });
    const shoppers = await Promise.all(
      [1, 2].map(async () => {
        const user = await createUser();
        const agent = await loginAs(user);
        const address = await createAddress(user);
        await addToCart(agent, variants[0]._id, 1);
        return { user, agent, address };
      }),
    );
    const results = await Promise.all(shoppers.map((s) => placeOrder(s.agent, s)));
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await Order.countDocuments()).toBe(1);
    expect(await stockOf(variants[0]._id)).toMatchObject({ available: 0, reserved: 0, sold: 1 });
  });

  it('rolls back partial reservations (with and without a transaction)', async () => {
    const { variants } = await createProduct({ variants: [{ size: 'S', stock: 5 }, { size: 'M', stock: 1 }] });
    const items = [
      { variantId: variants[0]._id, quantity: 2 },
      { variantId: variants[1]._id, quantity: 2 },
    ];

    const orderA = new mongoose.Types.ObjectId();
    await expect(inventoryService.reserve(items, { orderId: orderA })).rejects.toBeInstanceOf(AppError);

    const orderB = new mongoose.Types.ObjectId();
    await expect(
      withTransaction((session) => inventoryService.reserve(items, { orderId: orderB, session })),
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('Insufficient stock') });

    expect(await stockOf(variants[0]._id)).toMatchObject({ available: 5, reserved: 0 });
    expect(await stockOf(variants[1]._id)).toMatchObject({ available: 1, reserved: 0 });
    expect(await InventoryTransaction.countDocuments()).toBe(0);

    // Idempotent: reserving the same order twice only moves stock once.
    const orderC = new mongoose.Types.ObjectId();
    const ok = [{ variantId: variants[0]._id, quantity: 2 }];
    await inventoryService.reserve(ok, { orderId: orderC });
    await inventoryService.reserve(ok, { orderId: orderC });
    expect(await stockOf(variants[0]._id)).toMatchObject({ available: 3, reserved: 2 });
  });
});

describe('checkout – Razorpay', () => {
  let ctx;
  beforeEach(async () => {
    ctx = await setupShopper({ stock: 4, price: 1000 });
  });

  it('creates a pending order with reserved stock and checkout data', async () => {
    await addToCart(ctx.agent, ctx.variant._id, 2);
    const res = await placeOrder(ctx.agent, { ...ctx, paymentMethod: 'razorpay' });
    expect(res.status).toBe(201);
    const { order, payment } = res.body.data;
    expect(order).toMatchObject({ status: 'pending', paymentStatus: 'pending', canRetryPayment: true });
    expect(new Date(order.reservationExpiresAt).getTime()).toBeGreaterThan(Date.now() + 29 * 60_000);
    expect(payment).toMatchObject({
      provider: 'razorpay',
      keyId: 'rzp_test_dummykey',
      amount: 236000,
      currency: 'INR',
      orderId: order._id,
      orderNumber: order.orderNumber,
    });
    expect(payment.razorpayOrderId).toMatch(/^order_TEST/);
    expect(mocks.createOrder).toHaveBeenCalledWith(expect.objectContaining({ amountPaise: 236000, receipt: order.orderNumber }));
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 2, reserved: 2, sold: 0 });
    expect((await Order.findById(order._id)).inventoryState).toBe('reserved');
    expect((await Payment.findOne({ order: order._id })).razorpayOrderId).toBe(payment.razorpayOrderId);

    // retry payment reuses the gateway order; repeated key returns checkout again
    const retry = await ctx.agent.post(`/api/v1/orders/${order._id}/pay`);
    expect(retry.status).toBe(200);
    expect(retry.body.data.payment.razorpayOrderId).toBe(payment.razorpayOrderId);
    expect(mocks.createOrder).toHaveBeenCalledTimes(1);
  });

  it('cancelling a pending online order releases stock and the coupon', async () => {
    const coupon = await createCoupon();
    await addToCart(ctx.agent, ctx.variant._id, 2);
    await ctx.agent.post('/api/v1/cart/coupon').send({ code: 'FLAT100' });
    const { body } = await placeOrder(ctx.agent, { ...ctx, paymentMethod: 'razorpay' });
    expect((await Coupon.findById(coupon._id)).usedCount).toBe(1);

    const res = await ctx.agent.post(`/api/v1/orders/${body.data.order._id}/cancel`).send({ reason: 'Found cheaper' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('cancelled');
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 4, reserved: 0 });
    expect((await Coupon.findById(coupon._id)).usedCount).toBe(0);
    expect(await CouponUsage.countDocuments()).toBe(0);
    expect((await Payment.findOne({ order: body.data.order._id })).status).toBe('cancelled');
    expect(mocks.refund).not.toHaveBeenCalled();

    const pay = await ctx.agent.post(`/api/v1/orders/${body.data.order._id}/pay`);
    expect(pay.status).toBe(409);
  });

  it('cancels the order and releases stock when the gateway is down', async () => {
    mocks.createOrder.mockRejectedValueOnce(new AppError('Payment gateway error: timeout', 502));
    await addToCart(ctx.agent, ctx.variant._id, 1);
    const res = await placeOrder(ctx.agent, { ...ctx, paymentMethod: 'razorpay' });
    expect(res.status).toBe(502);
    const order = await Order.findOne().lean();
    expect(order).toMatchObject({ status: 'cancelled', inventoryState: 'released' });
    expect(order.cancellation.cancelledBy).toBe('system');
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 4, reserved: 0 });
  });
});
