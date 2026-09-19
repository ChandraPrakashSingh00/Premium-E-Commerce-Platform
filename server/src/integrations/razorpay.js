import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { safeEqual } from '../utils/helpers.js';

let client;

const getClient = () => {
  if (!env.razorpayEnabled) throw AppError.unavailable('Online payments are not configured');
  client ??= new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return client;
};

const unwrap = (err) => {
  const description = err?.error?.description || err?.message || 'Payment gateway error';
  return new AppError(`Payment gateway error: ${description}`, 502, [], 'PAYMENT_GATEWAY_ERROR');
};

export const razorpay = {
  isEnabled: () => env.razorpayEnabled,
  publicKey: () => env.RAZORPAY_KEY_ID,

  /** @param {{amountPaise:number, receipt:string, notes?:object}} p */
  async createOrder({ amountPaise, receipt, notes }) {
    try {
      return await getClient().orders.create({ amount: amountPaise, currency: 'INR', receipt, notes, payment_capture: true });
    } catch (err) {
      throw unwrap(err);
    }
  },

  async fetchPayment(paymentId) {
    try {
      return await getClient().payments.fetch(paymentId);
    } catch (err) {
      throw unwrap(err);
    }
  },

  async fetchOrderPayments(orderId) {
    try {
      const res = await getClient().orders.fetchPayments(orderId);
      return res.items ?? [];
    } catch (err) {
      throw unwrap(err);
    }
  },

  async refund({ paymentId, amountPaise, notes, receipt }) {
    try {
      return await getClient().payments.refund(paymentId, { amount: amountPaise, speed: 'normal', notes, receipt });
    } catch (err) {
      throw unwrap(err);
    }
  },

  /** Checkout signature: HMAC_SHA256(order_id|payment_id, key_secret). */
  verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    if (!env.RAZORPAY_KEY_SECRET) return false;
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    return safeEqual(expected, razorpaySignature);
  },

  /** Webhook signature: HMAC_SHA256(raw body, webhook secret). */
  verifyWebhookSignature(rawBody, signature) {
    if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
    const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
    return safeEqual(expected, signature);
  },
};
