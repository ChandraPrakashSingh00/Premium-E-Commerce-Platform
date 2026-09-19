import crypto from 'node:crypto';
import { Coupon } from '../src/models/index.js';
import { createAddress, createProduct, createUser, loginAs } from './helpers.js';

export const DAY = 24 * 60 * 60 * 1000;
export const RAZORPAY_SECRET = 'test_razorpay_secret';
export const WEBHOOK_SECRET = 'test_webhook_secret';

/** A logged-in customer with an address and one product in stock. */
export async function setupShopper({ stock = 5, price = 1000, taxRate = 18 } = {}) {
  const user = await createUser();
  const agent = await loginAs(user);
  const address = await createAddress(user);
  const { product, variants } = await createProduct({ price, taxRate, variants: [{ stock }] });
  return { user, agent, address, product, variant: variants[0] };
}

export const addToCart = (agent, variantId, quantity = 1) =>
  agent.post('/api/v1/cart/items').send({ variantId: String(variantId), quantity });

export const placeOrder = (agent, { user, address, paymentMethod = 'cod', key = crypto.randomUUID() }) =>
  agent
    .post('/api/v1/orders')
    .set('X-Idempotency-Key', key)
    .send({
      addressId: String(address._id),
      contact: { name: user.name, email: user.email, phone: '9876543210' },
      paymentMethod,
    });

export const createCoupon = (overrides = {}) =>
  Coupon.create({
    code: 'FLAT100',
    discountType: 'fixed',
    discountValue: 100,
    startsAt: new Date(Date.now() - DAY),
    expiresAt: new Date(Date.now() + DAY),
    ...overrides,
  });

export const signPayment = (razorpayOrderId, razorpayPaymentId) =>
  crypto.createHmac('sha256', RAZORPAY_SECRET).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex');

export const signWebhook = (body) => crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
