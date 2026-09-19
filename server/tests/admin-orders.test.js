import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Inventory, InventoryTransaction, Order, Payment, Product, ProductVariant } from '../src/models/index.js';
import { addToCart, DAY, placeOrder, setupShopper, signPayment } from './commerceHelpers.js';
import { createAdmin, loginAs } from './helpers.js';

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

let admin;
let ctx;
let order;

beforeEach(async () => {
  vi.clearAllMocks();
  mocks.createOrder.mockImplementation(async ({ amountPaise }) => ({ id: `order_ADM${Date.now()}`, amount: amountPaise }));
  mocks.fetchPayment.mockRejectedValue(new Error('offline'));
  mocks.refund.mockImplementation(async ({ amountPaise }) => ({ id: `rfnd_${amountPaise}`, status: 'processed' }));

  admin = await loginAs(await createAdmin());
  ctx = await setupShopper({ stock: 5, price: 1000 });
  await addToCart(ctx.agent, ctx.variant._id, 2);
  const res = await placeOrder(ctx.agent, ctx);
  order = res.body.data.order;
});

const setStatus = (status, extra = {}) => admin.patch(`/api/v1/admin/orders/${order._id}/status`).send({ status, ...extra });
const stockOf = (variantId) => Inventory.findOne({ variant: variantId }).lean();

async function deliver() {
  for (const status of ['processing', 'packed', 'shipped', 'delivered']) {
    const res = await setStatus(status);
    expect(res.status).toBe(200);
  }
}

describe('admin orders', () => {
  it('blocks non-admin users', async () => {
    expect((await ctx.agent.get('/api/v1/admin/orders')).status).toBe(403);
    expect((await ctx.agent.patch(`/api/v1/admin/orders/${order._id}/status`).send({ status: 'processing' })).status).toBe(403);
    expect((await ctx.agent.get('/api/v1/admin/inventory')).status).toBe(403);
    expect((await ctx.agent.get('/api/v1/admin/payments')).status).toBe(403);
  });

  it('lists, searches and shows orders with allowed transitions', async () => {
    let res = await admin.get(`/api/v1/admin/orders?q=${encodeURIComponent(ctx.user.email.toUpperCase())}`);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].customer).toEqual({ name: ctx.user.name, email: ctx.user.email });
    res = await admin.get(`/api/v1/admin/orders?q=${order.orderNumber}&status=confirmed&paymentMethod=cod`);
    expect(res.body.data.items).toHaveLength(1);
    res = await admin.get('/api/v1/admin/orders?q=.*');
    expect(res.body.data.items).toHaveLength(0);
    res = await admin.get('/api/v1/admin/orders?status=delivered');
    expect(res.body.data.items).toHaveLength(0);

    const detail = await admin.get(`/api/v1/admin/orders/${order._id}`);
    expect(detail.body.data).toMatchObject({ orderNumber: order.orderNumber, allowedTransitions: ['processing', 'cancelled'] });
    expect(detail.body.data.user.email).toBe(ctx.user.email);
    expect(detail.body.data.payment.method).toBe('cod');
  });

  it('applies valid transitions, rejects invalid ones and stamps timestamps', async () => {
    expect((await setStatus('delivered')).status).toBe(409);
    expect((await setStatus('returned')).status).toBe(409);
    expect((await setStatus('bogus')).status).toBe(422);

    expect((await setStatus('processing', { note: 'Picking' })).status).toBe(200);
    expect((await setStatus('packed')).status).toBe(200);
    const shipped = await setStatus('shipped', { tracking: { carrier: 'BlueDart', trackingNumber: 'BD123' } });
    expect(shipped.status).toBe(200);
    expect(shipped.body.data.tracking).toMatchObject({ carrier: 'BlueDart', trackingNumber: 'BD123' });
    expect(shipped.body.data.tracking.shippedAt).toBeTruthy();
    expect(shipped.body.data.allowedTransitions).toEqual(['out_for_delivery', 'delivered']);
    expect((await setStatus('processing')).status).toBe(409);
    expect((await setStatus('cancelled')).status).toBe(409);

    const tracking = await admin.patch(`/api/v1/admin/orders/${order._id}/tracking`).send({ trackingUrl: 'https://track.example.com/BD123' });
    expect(tracking.body.data.tracking.trackingUrl).toBe('https://track.example.com/BD123');

    const delivered = await setStatus('delivered');
    expect(delivered.status).toBe(200);
    expect(delivered.body.data.tracking.deliveredAt).toBeTruthy();
    // COD delivered => collected
    expect(delivered.body.data.paymentStatus).toBe('paid');
    expect(delivered.body.data.paidAt).toBeTruthy();
    expect((await Payment.findOne({ order: order._id })).status).toBe('captured');

    const dbOrder = await Order.findById(order._id).lean();
    expect(dbOrder.statusHistory.map((h) => h.status)).toEqual(['pending', 'confirmed', 'processing', 'packed', 'shipped', 'delivered']);
    expect(dbOrder.notificationsSent).toEqual(expect.arrayContaining(['shipped', 'delivered']));

    const customerView = await ctx.agent.get(`/api/v1/orders/${order._id}`);
    expect(customerView.body.data).toMatchObject({ canReturn: true, canCancel: false });
  });

  it('marks COD payment as collected and saves notes', async () => {
    await setStatus('processing');
    const paid = await admin.patch(`/api/v1/admin/orders/${order._id}/payment-status`).send({ paymentStatus: 'paid' });
    expect(paid.status).toBe(200);
    expect(paid.body.data.paymentStatus).toBe('paid');
    const note = await admin.patch(`/api/v1/admin/orders/${order._id}/note`).send({ adminNote: 'VIP customer' });
    expect(note.body.data.adminNote).toBe('VIP customer');
    const customerView = await ctx.agent.get(`/api/v1/orders/${order._id}`);
    expect(customerView.body.data.adminNote).toBeUndefined();
  });

  it('admin cancellation returns committed stock', async () => {
    const res = await admin.post(`/api/v1/admin/orders/${order._id}/cancel`).send({ reason: 'Fraud check failed' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'cancelled', allowedTransitions: [] });
    expect(res.body.data.cancellation.cancelledBy).toBe('admin');
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 5, sold: 0 });
  });

  it('runs the return flow: request, approve, complete (restock + refund)', async () => {
    const early = await ctx.agent.post(`/api/v1/orders/${order._id}/return`).send({ reason: 'Wrong size' });
    expect(early.status).toBe(409);
    await deliver();
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 3, sold: 2 });

    const completeEarly = await admin.patch(`/api/v1/admin/orders/${order._id}/return`).send({ action: 'complete' });
    expect(completeEarly.status).toBe(409);

    const requested = await ctx.agent.post(`/api/v1/orders/${order._id}/return`).send({ reason: 'Wrong size', comment: 'Too small' });
    expect(requested.status).toBe(200);
    expect(requested.body.data.returnRequest).toMatchObject({ status: 'requested', reason: 'Wrong size' });
    expect(requested.body.data.canReturn).toBe(false);
    const dup = await ctx.agent.post(`/api/v1/orders/${order._id}/return`).send({ reason: 'Again' });
    expect(dup.status).toBe(409);

    const approved = await admin.patch(`/api/v1/admin/orders/${order._id}/return`).send({ action: 'approve', note: 'Pickup booked' });
    expect(approved.body.data.returnRequest).toMatchObject({ status: 'approved', adminNote: 'Pickup booked' });

    const completed = await admin.patch(`/api/v1/admin/orders/${order._id}/return`).send({ action: 'complete' });
    expect(completed.status).toBe(200);
    expect(completed.body.data).toMatchObject({ status: 'refunded', paymentStatus: 'refunded', inventoryState: 'returned' });
    expect(completed.body.data.returnRequest.status).toBe('completed');
    expect(completed.body.data.refund).toMatchObject({ status: 'processed', amount: 2360 });
    expect(completed.body.data.statusHistory.map((h) => h.status).slice(-2)).toEqual(['returned', 'refunded']);
    expect(mocks.refund).not.toHaveBeenCalled(); // COD refunds are settled manually

    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 5, reserved: 0, sold: 0 });
    expect(await InventoryTransaction.countDocuments({ order: order._id, type: 'RETURN' })).toBe(1);
    expect((await Product.findById(ctx.product._id)).soldCount).toBe(0);
  });

  it('rejects returns outside the window and supports rejecting requests', async () => {
    await deliver();
    await Order.updateOne({ _id: order._id }, { $set: { 'tracking.deliveredAt': new Date(Date.now() - 30 * DAY) } });
    const late = await ctx.agent.post(`/api/v1/orders/${order._id}/return`).send({ reason: 'Wrong size' });
    expect(late.status).toBe(409);
    expect(late.body.message).toMatch(/return window/);

    await Order.updateOne({ _id: order._id }, { $set: { 'tracking.deliveredAt': new Date() } });
    await ctx.agent.post(`/api/v1/orders/${order._id}/return`).send({ reason: 'Wrong size' });
    const rejected = await admin.patch(`/api/v1/admin/orders/${order._id}/return`).send({ action: 'reject', note: 'Used item' });
    expect(rejected.body.data.returnRequest).toMatchObject({ status: 'rejected', adminNote: 'Used item' });
    expect(rejected.body.data.status).toBe('delivered');
  });

  it('refunds online orders partially and never more than was paid', async () => {
    await addToCart(ctx.agent, ctx.variant._id, 2);
    const placed = await placeOrder(ctx.agent, { ...ctx, paymentMethod: 'razorpay' });
    const online = placed.body.data;
    await ctx.agent.post('/api/v1/payments/razorpay/verify').send({
      orderId: online.order._id,
      razorpayOrderId: online.payment.razorpayOrderId,
      razorpayPaymentId: 'pay_ADMIN1',
      razorpaySignature: signPayment(online.payment.razorpayOrderId, 'pay_ADMIN1'),
    });
    const url = `/api/v1/admin/orders/${online.order._id}/refund`;
    const partial = await admin.post(url).send({ amount: 1000, reason: 'Damaged item' });
    expect(partial.status).toBe(200);
    expect(partial.body.data).toMatchObject({ paymentStatus: 'partially_refunded', status: 'confirmed' });
    expect(mocks.refund).toHaveBeenCalledWith(expect.objectContaining({ paymentId: 'pay_ADMIN1', amountPaise: 100000 }));

    const tooMuch = await admin.post(url).send({ amount: 2000 });
    expect(tooMuch.status).toBe(409);

    const rest = await admin.post(url).send({});
    expect(rest.body.data.paymentStatus).toBe('refunded');
    expect(rest.body.data.refund.amount).toBe(2360);
    expect(rest.body.data.payment.amountRefunded).toBe(2360);
    expect((await admin.post(url).send({})).status).toBe(409);

    const payments = await admin.get('/api/v1/admin/payments?method=razorpay');
    expect(payments.body.data.items).toHaveLength(1);
    expect(payments.body.data.items[0].order.orderNumber).toBe(online.order.orderNumber);
    expect(payments.body.data.meta).toMatchObject({ capturedAmount: 2360, refundedAmount: 2360, failedCount: 0 });
    const search = await admin.get(`/api/v1/admin/payments?q=${online.order.orderNumber}`);
    expect(search.body.data.items).toHaveLength(1);
    const one = await admin.get(`/api/v1/admin/payments/${payments.body.data.items[0]._id}`);
    expect(one.body.data.refunds).toHaveLength(2);
  });
});

describe('admin inventory', () => {
  it('lists inventory with product/variant data and meta counts', async () => {
    await Inventory.updateOne({ variant: ctx.variant._id }, { $set: { available: 2 } });
    const res = await admin.get('/api/v1/admin/inventory');
    expect(res.status).toBe(200);
    expect(res.body.data.meta).toEqual({ totalSkus: 1, lowStock: 1, outOfStock: 0 });
    const row = res.body.data.items[0];
    expect(row).toMatchObject({ sku: ctx.variant.sku, available: 2, reserved: 0, sold: 2, isLowStock: true });
    expect(row.product).toMatchObject({ name: ctx.product.name, slug: ctx.product.slug });
    expect(row.variant).toHaveProperty('title');

    expect((await admin.get('/api/v1/admin/inventory?status=out')).body.data.items).toHaveLength(0);
    expect((await admin.get(`/api/v1/admin/inventory?q=${encodeURIComponent(ctx.product.name)}`)).body.data.items).toHaveLength(1);
  });

  it('records audited adjustments and syncs product stock', async () => {
    const inv = await Inventory.findOne({ variant: ctx.variant._id });
    const url = `/api/v1/admin/inventory/${inv._id}`;

    let res = await admin.patch(url).send({ mode: 'increment', quantity: 7, reason: 'New shipment' });
    expect(res.status).toBe(200);
    expect(res.body.data.available).toBe(10);
    res = await admin.patch(url).send({ mode: 'decrement', quantity: 4, reason: 'Damaged', lowStockThreshold: 2 });
    expect(res.body.data).toMatchObject({ available: 6, lowStockThreshold: 2, isLowStock: false });
    res = await admin.patch(url).send({ mode: 'set', quantity: 0, reason: 'Stock count' });
    expect(res.body.data.available).toBe(0);
    res = await admin.patch(url).send({ mode: 'decrement', quantity: 1, reason: 'Oops' });
    expect(res.status).toBe(409);
    res = await admin.patch(url).send({ mode: 'increment', quantity: 0, reason: 'Nothing' });
    expect(res.status).toBe(422);

    const txns = await InventoryTransaction.find({ inventory: inv._id, type: 'ADJUSTMENT' }).sort({ createdAt: 1 }).lean();
    expect(txns.map((t) => t.quantity)).toEqual([7, -4, -6]);
    expect(txns[0]).toMatchObject({ reason: 'New shipment', availableAfter: 10 });
    expect(txns.every((t) => t.performedBy)).toBe(true);

    expect((await ProductVariant.findById(ctx.variant._id)).stock).toBe(0);
    expect((await Product.findById(ctx.product._id)).stock).toBe(0);

    const list = await admin.get(`/api/v1/admin/inventory/transactions?type=ADJUSTMENT&inventoryId=${inv._id}`);
    expect(list.body.data.items).toHaveLength(3);
    expect(list.body.data.items[0].performedBy).toHaveProperty('name');
    const sales = await admin.get(`/api/v1/admin/inventory/transactions?type=SALE&productId=${ctx.product._id}`);
    expect(sales.body.data.items[0].order.orderNumber).toBe(order.orderNumber);
  });
});
