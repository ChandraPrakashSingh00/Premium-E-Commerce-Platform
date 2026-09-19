import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { INVENTORY_STATE, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/index.js';
import { razorpay } from '../integrations/razorpay.js';
import { Order, Payment } from '../models/index.js';
import { orderLifecycle } from '../services/orderLifecycle.service.js';

const RESERVATION_SWEEP_MS = 60_000;
const BATCH_SIZE = 100;

let timer = null;
let running = false;

/** Returns the captured gateway payment for an order, null if none, undefined if unknown (gateway error). */
async function findCapturedPayment(orderId) {
  if (!razorpay.isEnabled()) return null;
  const payment = await Payment.findOne({ order: orderId }).select('razorpayOrderId').lean();
  if (!payment?.razorpayOrderId) return null;
  try {
    const payments = await razorpay.fetchOrderPayments(payment.razorpayOrderId);
    return payments.find((p) => p.status === 'captured') ?? null;
  } catch (err) {
    logger.warn({ err, orderId }, 'Could not check gateway payments before expiring reservation');
    return undefined;
  }
}

/**
 * Cancels unpaid online orders whose stock reservation expired (releasing stock and
 * coupon usage). Orders that were actually paid are confirmed instead.
 */
export async function expireStaleReservations({ now = new Date() } = {}) {
  if (running) return { skipped: true };
  running = true;
  const result = { processed: 0, cancelled: 0, confirmed: 0, failed: 0 };
  try {
    const orders = await Order.find({
      inventoryState: INVENTORY_STATE.RESERVED,
      paymentMethod: PAYMENT_METHOD.RAZORPAY,
      paymentStatus: { $ne: PAYMENT_STATUS.PAID },
      reservationExpiresAt: { $lte: now },
    })
      .sort({ reservationExpiresAt: 1 })
      .limit(BATCH_SIZE);

    for (const order of orders) {
      result.processed += 1;
      try {
        const captured = await findCapturedPayment(order._id);
        if (captured) {
          await orderLifecycle.confirmPayment({ order, razorpayPaymentId: captured.id, source: 'system', method: captured.method });
          result.confirmed += 1;
          continue;
        }
        // Gateway unreachable (undefined): cancel anyway – a late capture is reconciled
        // by confirmPayment (reinstate or refund) when the webhook arrives.
        await orderLifecycle.cancelOrder({ orderId: order._id, by: 'system', reason: 'Payment not completed in time' });
        result.cancelled += 1;
      } catch (err) {
        result.failed += 1;
        logger.error({ err, orderId: order._id }, 'Failed to expire reservation');
      }
    }
    if (result.processed) logger.info(result, 'Reservation sweep finished');
    return result;
  } finally {
    running = false;
  }
}

export function startJobs() {
  if (env.isTest || timer) return;
  timer = setInterval(() => {
    expireStaleReservations().catch((err) => logger.error({ err }, 'Reservation sweep crashed'));
  }, RESERVATION_SWEEP_MS);
  timer.unref();
  logger.info('Background jobs started');
}

export function stopJobs() {
  if (timer) clearInterval(timer);
  timer = null;
}
