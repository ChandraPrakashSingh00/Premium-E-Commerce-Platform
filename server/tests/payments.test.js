import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { expireStaleReservations } from '../src/jobs/index.js';
import { Inventory, InventoryTransaction, Notification, Order, Payment, WebhookEvent } from '../src/models/index.js';
import { orderLifecycle } from '../src/services/orderLifecycle.service.js';
import { AppError } from '../src/utils/AppError.js';
import { addToCart, placeOrder, setupShopper, signPayment, signWebhook } from './commerceHelpers.js';
import { app } from './helpers.js';

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

const AMOUNT_PAISE = 236000; // 2 x 1000 + 18% tax
let seq = 0;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  mocks.createOrder.mockImplementation(async ({ amountPaise }) => {
    seq += 1;
    return { id: `order_PAY${seq}`, amount: amountPaise, status: 'created' };
  });
  mocks.fetchPayment.mockImplementation(async (id) => ({ id, status: 'captured', amount: AMOUNT_PAISE, method: 'upi' }));
  mocks.fetchOrderPayments.mockResolvedValue([]);
  mocks.refund.mockImplementation(async ({ amountPaise }) => ({ id: `rfnd_${seq}`, amount: amountPaise, status: 'processed' }));
});

async function onlineOrder() {
  const ctx = await setupShopper({ stock: 3, price: 1000 });
  await addToCart(ctx.agent, ctx.variant._id, 2);
  const res = await placeOrder(ctx.agent, { ...ctx, paymentMethod: 'razorpay' });
  expect(res.status).toBe(201);
  const { order, payment } = res.body.data;
  fetchMockOrder(payment.razorpayOrderId);
  return { ...ctx, order, rzpOrderId: payment.razorpayOrderId };
}

function fetchMockOrder(orderId) {
  mocks.fetchPayment.mockImplementation(async (id) => ({ id, order_id: orderId, status: 'captured', amount: AMOUNT_PAISE, method: 'upi' }));
}

const verify = (ctx, paymentId = 'pay_OK1', signature = signPayment(ctx.rzpOrderId, paymentId)) =>
  ctx.agent.post('/api/v1/payments/razorpay/verify').send({
    orderId: ctx.order._id,
    razorpayOrderId: ctx.rzpOrderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: signature,
  });

function sendWebhook(payload, { eventId, signature } = {}) {
  const body = JSON.stringify(payload);
  const req = request(app)
    .post('/api/v1/payments/razorpay/webhook')
    .set('Content-Type', 'application/json')
    .set('x-razorpay-signature', signature ?? signWebhook(body));
  if (eventId) req.set('x-razorpay-event-id', eventId);
  return req.send(body);
}

const capturedEvent = (rzpOrderId, paymentId = 'pay_WH1', event = 'payment.captured') => ({
  event,
  payload: { payment: { entity: { id: paymentId, order_id: rzpOrderId, amount: AMOUNT_PAISE, status: 'captured', method: 'card' } } },
});

const stockOf = (variantId) => Inventory.findOne({ variant: variantId }).lean();

describe('payments – verify & failure', () => {
  it('exposes the public config', async () => {
    const res = await request(app).get('/api/v1/payments/config');
    expect(res.body.data).toEqual({ razorpayEnabled: true, keyId: 'rzp_test_dummykey', codEnabled: true });
  });

  it('confirms a payment with a valid signature and is idempotent', async () => {
    const ctx = await onlineOrder();
    const res = await verify(ctx);
    expect(res.status).toBe(200);
    expect(res.body.data.order).toMatchObject({ status: 'confirmed', paymentStatus: 'paid', canRetryPayment: false });
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 1, reserved: 0, sold: 2 });

    const payment = await Payment.findOne({ order: ctx.order._id }).lean();
    expect(payment).toMatchObject({ status: 'captured', razorpayPaymentId: 'pay_OK1', paymentMode: 'upi' });
    const dbOrder = await Order.findById(ctx.order._id).lean();
    expect(dbOrder).toMatchObject({ inventoryState: 'committed' });
    expect(dbOrder.paidAt).toBeTruthy();
    expect(dbOrder.notificationsSent).toEqual(expect.arrayContaining(['placed', 'paid']));

    const again = await verify(ctx);
    expect(again.status).toBe(200);
    expect(again.body.data.order.paymentStatus).toBe('paid');
    expect(await InventoryTransaction.countDocuments({ order: ctx.order._id, type: 'SALE' })).toBe(1);
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 1, sold: 2 });
    expect(await Notification.countDocuments({ user: ctx.user._id, type: 'payment_success' })).toBe(1);
  });

  it('rejects an invalid signature and leaves the order pending', async () => {
    const ctx = await onlineOrder();
    const res = await verify(ctx, 'pay_BAD', 'a'.repeat(64));
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Payment verification failed');
    const order = await Order.findById(ctx.order._id).lean();
    expect(order).toMatchObject({ status: 'pending', paymentStatus: 'pending', inventoryState: 'reserved' });
    const payment = await Payment.findOne({ order: ctx.order._id }).lean();
    expect(payment.status).toBe('created');
    expect(payment.attempts.at(-1)).toMatchObject({ status: 'verification_failed', source: 'verify' });
    expect(mocks.fetchPayment).not.toHaveBeenCalled();
  });

  it('rejects mismatched gateway orders, amounts and other users', async () => {
    const ctx = await onlineOrder();
    const wrongOrder = await ctx.agent.post('/api/v1/payments/razorpay/verify').send({
      orderId: ctx.order._id,
      razorpayOrderId: 'order_OTHER',
      razorpayPaymentId: 'pay_X',
      razorpaySignature: signPayment('order_OTHER', 'pay_X'),
    });
    expect(wrongOrder.status).toBe(400);

    mocks.fetchPayment.mockResolvedValueOnce({ id: 'pay_OK1', order_id: ctx.rzpOrderId, status: 'captured', amount: 100 });
    const wrongAmount = await verify(ctx);
    expect(wrongAmount.status).toBe(400);
    expect((await Order.findById(ctx.order._id)).paymentStatus).toBe('pending');

    const other = await setupShopper();
    const res = await verify({ ...ctx, agent: other.agent });
    expect(res.status).toBe(404);
  });

  it('trusts a verified signature when the gateway cannot be reached', async () => {
    const ctx = await onlineOrder();
    mocks.fetchPayment.mockRejectedValueOnce(new AppError('Payment gateway error: timeout', 502));
    const res = await verify(ctx);
    expect(res.status).toBe(200);
    expect(res.body.data.order.paymentStatus).toBe('paid');
  });

  it('records client-side failures without trusting them for success', async () => {
    const ctx = await onlineOrder();
    const url = '/api/v1/payments/razorpay/failure';
    let res = await ctx.agent.post(url).send({ orderId: ctx.order._id, razorpayOrderId: ctx.rzpOrderId, cancelled: true });
    expect(res.status).toBe(200);
    expect(res.body.data.order.paymentStatus).toBe('pending');

    res = await ctx.agent.post(url).send({
      orderId: ctx.order._id,
      razorpayOrderId: ctx.rzpOrderId,
      error: { code: 'BAD_REQUEST_ERROR', description: 'Card declined', paymentId: 'pay_F1' },
    });
    expect(res.body.data.order).toMatchObject({ status: 'pending', paymentStatus: 'failed', canRetryPayment: true });
    const payment = await Payment.findOne({ order: ctx.order._id }).lean();
    expect(payment.attempts.map((a) => a.status)).toEqual(['cancelled', 'failed']);
    expect(payment.status).toBe('failed');

    // a later successful payment still wins
    expect((await verify(ctx)).body.data.order.paymentStatus).toBe('paid');
    res = await ctx.agent.post(url).send({ orderId: ctx.order._id, razorpayOrderId: ctx.rzpOrderId, error: { code: 'X' } });
    expect(res.body.data.order.paymentStatus).toBe('paid');
  });
});

describe('payments – webhooks', () => {
  it('rejects a bad signature', async () => {
    const res = await sendWebhook({ event: 'payment.captured' }, { signature: 'f'.repeat(64) });
    expect(res.status).toBe(400);
    const missing = await request(app).post('/api/v1/payments/razorpay/webhook').set('Content-Type', 'application/json').send('{}');
    expect(missing.status).toBe(400);
    expect(await WebhookEvent.countDocuments()).toBe(0);
  });

  it('processes payment.captured once even if delivered twice', async () => {
    const ctx = await onlineOrder();
    const spy = vi.spyOn(orderLifecycle, 'confirmPayment');
    const event = capturedEvent(ctx.rzpOrderId);
    const first = await sendWebhook(event, { eventId: 'evt_1' });
    const second = await sendWebhook(event, { eventId: 'evt_1' });
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.message).toBe('Event already processed');
    expect(spy).toHaveBeenCalledTimes(1);

    // A different event for the same payment (order.paid) is harmless.
    const third = await sendWebhook(capturedEvent(ctx.rzpOrderId, 'pay_WH1', 'order.paid'), { eventId: 'evt_2' });
    expect(third.status).toBe(200);

    const order = await Order.findById(ctx.order._id).lean();
    expect(order).toMatchObject({ status: 'confirmed', paymentStatus: 'paid', inventoryState: 'committed' });
    expect(await InventoryTransaction.countDocuments({ order: ctx.order._id, type: 'SALE' })).toBe(1);
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 1, reserved: 0, sold: 2 });
    expect((await WebhookEvent.findOne({ eventId: 'evt_1' })).status).toBe('processed');
    expect((await Payment.findOne({ order: ctx.order._id })).attempts.at(-1).source).toBe('webhook');
  });

  it('marks payment.failed and keeps the order open for retry', async () => {
    const ctx = await onlineOrder();
    const res = await sendWebhook({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: { id: 'pay_F9', order_id: ctx.rzpOrderId, status: 'failed', error_code: 'BAD', error_description: 'Insufficient funds' },
        },
      },
    });
    expect(res.status).toBe(200);
    const order = await Order.findById(ctx.order._id).lean();
    expect(order).toMatchObject({ status: 'pending', paymentStatus: 'failed', inventoryState: 'reserved' });
    const payment = await Payment.findOne({ order: ctx.order._id }).lean();
    expect(payment).toMatchObject({ status: 'failed', failureReason: 'Insufficient funds' });
    expect(await Notification.countDocuments({ type: 'payment_failed' })).toBe(1);
  });

  it('ignores unknown events and unknown orders', async () => {
    expect((await sendWebhook({ event: 'payment.authorized', payload: {} })).body.message).toBe('ignored');
    const res = await sendWebhook(capturedEvent('order_UNKNOWN'));
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/unknown/);
  });

  it('returns 500 on internal errors and allows the retry to reprocess', async () => {
    const ctx = await onlineOrder();
    vi.spyOn(orderLifecycle, 'confirmPayment').mockRejectedValueOnce(new Error('db down'));
    const event = capturedEvent(ctx.rzpOrderId);
    const failed = await sendWebhook(event, { eventId: 'evt_retry' });
    expect(failed.status).toBe(500);
    expect(await WebhookEvent.countDocuments({ eventId: 'evt_retry' })).toBe(0);

    const retried = await sendWebhook(event, { eventId: 'evt_retry' });
    expect(retried.status).toBe(200);
    expect((await Order.findById(ctx.order._id)).paymentStatus).toBe('paid');
  });

  it('refunds paid orders on cancellation and applies refund webhooks', async () => {
    const ctx = await onlineOrder();
    await verify(ctx);
    mocks.refund.mockResolvedValueOnce({ id: 'rfnd_PEND', status: 'pending', amount: AMOUNT_PAISE });
    const cancel = await ctx.agent.post(`/api/v1/orders/${ctx.order._id}/cancel`).send({ reason: 'No longer needed' });
    expect(cancel.status).toBe(200);
    expect(mocks.refund).toHaveBeenCalledWith(expect.objectContaining({ paymentId: 'pay_OK1', amountPaise: AMOUNT_PAISE }));
    expect(cancel.body.data).toMatchObject({ status: 'refunded', paymentStatus: 'refunded' });
    expect(cancel.body.data.refund).toMatchObject({ status: 'pending', amount: 2360 });
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 3, sold: 0 });

    const res = await sendWebhook({ event: 'refund.processed', payload: { refund: { entity: { id: 'rfnd_PEND', payment_id: 'pay_OK1' } } } });
    expect(res.status).toBe(200);
    const order = await Order.findById(ctx.order._id).lean();
    expect(order.refund.status).toBe('processed');
    expect(order.refund.processedAt).toBeTruthy();
    expect(order.notificationsSent).toContain('refunded');
    const payment = await Payment.findOne({ order: ctx.order._id }).lean();
    expect(payment).toMatchObject({ status: 'refunded', amountRefunded: 2360 });
    expect(payment.refunds[0].status).toBe('processed');
  });
});

describe('reservation expiry job', () => {
  const expire = (orderId) => Order.updateOne({ _id: orderId }, { $set: { reservationExpiresAt: new Date(Date.now() - 1000) } });

  it('cancels expired unpaid orders and releases stock', async () => {
    const ctx = await onlineOrder();
    const fresh = await expireStaleReservations();
    expect(fresh.processed).toBe(0);

    await expire(ctx.order._id);
    const result = await expireStaleReservations();
    expect(result).toMatchObject({ processed: 1, cancelled: 1 });
    const order = await Order.findById(ctx.order._id).lean();
    expect(order).toMatchObject({ status: 'cancelled', inventoryState: 'released' });
    expect(order.cancellation).toMatchObject({ cancelledBy: 'system', reason: 'Payment not completed in time' });
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 3, reserved: 0 });
    expect((await ctx.agent.post(`/api/v1/orders/${ctx.order._id}/pay`)).status).toBe(409);
  });

  it('confirms instead of cancelling when the gateway shows a captured payment', async () => {
    const ctx = await onlineOrder();
    await expire(ctx.order._id);
    mocks.fetchOrderPayments.mockResolvedValueOnce([{ id: 'pay_LATE', status: 'captured', method: 'upi' }]);
    const result = await expireStaleReservations();
    expect(result).toMatchObject({ confirmed: 1, cancelled: 0 });
    expect(await Order.findById(ctx.order._id).lean()).toMatchObject({ status: 'confirmed', paymentStatus: 'paid' });
  });

  it('reinstates a late-paid expired order when stock is still available', async () => {
    const ctx = await onlineOrder();
    await expire(ctx.order._id);
    await expireStaleReservations();
    const res = await sendWebhook(capturedEvent(ctx.rzpOrderId, 'pay_LATE2'));
    expect(res.status).toBe(200);
    const order = await Order.findById(ctx.order._id).lean();
    expect(order).toMatchObject({ status: 'confirmed', paymentStatus: 'paid', inventoryState: 'committed' });
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 1, reserved: 0, sold: 2 });
    expect(mocks.refund).not.toHaveBeenCalled();
  });

  it('refunds a late payment when the stock is gone', async () => {
    const ctx = await onlineOrder();
    await expire(ctx.order._id);
    await expireStaleReservations();
    await Inventory.updateOne({ variant: ctx.variant._id }, { $set: { available: 1 } });
    await sendWebhook(capturedEvent(ctx.rzpOrderId, 'pay_LATE3'));
    const order = await Order.findById(ctx.order._id).lean();
    expect(order).toMatchObject({ status: 'refunded', paymentStatus: 'refunded' });
    expect(order.refund).toMatchObject({ status: 'processed', amount: 2360 });
    expect(mocks.refund).toHaveBeenCalledWith(expect.objectContaining({ paymentId: 'pay_LATE3', amountPaise: AMOUNT_PAISE }));
    expect(await stockOf(ctx.variant._id)).toMatchObject({ available: 1, sold: 0 });
  });
});
