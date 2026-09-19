import { logger } from '../config/logger.js';
import { PAYMENT_RECORD_STATUS, PAYMENT_STATUS } from '../constants/index.js';
import { razorpay } from '../integrations/razorpay.js';
import { Order, Payment, WebhookEvent } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, isDuplicateKeyError, sha256, toPaise } from '../utils/helpers.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { notificationService } from './notification.service.js';
import { orderLifecycle } from './orderLifecycle.service.js';
import { toCustomerOrder } from './order.service.js';
import { refundService } from './refund.service.js';
import { settingsService } from './settings.service.js';

const SETTLED = [PAYMENT_STATUS.PAID, PAYMENT_STATUS.REFUNDED, PAYMENT_STATUS.PARTIALLY_REFUNDED];
const STALE_CLAIM_MS = 5 * 60 * 1000;

async function loadOwnedPayment(userId, orderId, razorpayOrderId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) throw AppError.notFound('Order not found');
  const payment = await Payment.findOne({ order: order._id });
  if (!payment || !payment.razorpayOrderId || payment.razorpayOrderId !== razorpayOrderId) {
    throw AppError.badRequest('Payment does not match this order');
  }
  return { order, payment };
}

/** Records a failed / cancelled attempt. Never touches captured payments or paid orders. */
async function recordFailure(payment, { razorpayPaymentId, status, method, code, description, source }) {
  const failed = status === 'failed';
  await Payment.updateOne(
    { _id: payment._id },
    { $push: { attempts: { razorpayPaymentId, status, method, errorCode: code, errorDescription: description, source } } },
  );
  if (!failed) return null;
  await Payment.updateOne(
    { _id: payment._id, status: { $in: [PAYMENT_RECORD_STATUS.CREATED, PAYMENT_RECORD_STATUS.FAILED] } },
    { $set: { status: PAYMENT_RECORD_STATUS.FAILED, failureReason: description || code || 'Payment failed' } },
  );
  return Order.findOneAndUpdate(
    { _id: payment.order, paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED] } },
    { $set: { paymentStatus: PAYMENT_STATUS.FAILED } },
    { returnDocument: 'after' },
  );
}

/** payment.captured / order.paid */
async function onCaptured(paymentEntity) {
  if (!paymentEntity?.order_id) return 'ignored: no order id';
  const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
  if (!payment) return 'ignored: unknown order';
  if (Number(paymentEntity.amount) !== toPaise(payment.amount)) {
    logger.error({ razorpayOrderId: paymentEntity.order_id, amount: paymentEntity.amount }, 'Captured amount mismatch');
    return 'ignored: amount mismatch';
  }
  const order = await Order.findById(payment.order);
  if (!order) return 'ignored: order missing';
  await orderLifecycle.confirmPayment({
    order,
    razorpayPaymentId: paymentEntity.id,
    source: 'webhook',
    method: paymentEntity.method,
  });
  return 'payment confirmed';
}

async function onFailed(entity) {
  const payment = entity?.order_id && (await Payment.findOne({ razorpayOrderId: entity.order_id }));
  if (!payment) return 'ignored: unknown order';
  const order = await recordFailure(payment, {
    razorpayPaymentId: entity.id,
    status: 'failed',
    method: entity.method,
    code: entity.error_code,
    description: entity.error_description,
    source: 'webhook',
  });
  if (order) await notificationService.orderEvent(order, 'payment_failed');
  return 'payment failure recorded';
}

async function dispatch(payload) {
  const p = payload.payload ?? {};
  switch (payload.event) {
    case 'payment.captured':
    case 'order.paid':
      return onCaptured(p.payment?.entity);
    case 'payment.failed':
      return onFailed(p.payment?.entity);
    case 'refund.processed':
      return refundService.applyRefundEvent(p.refund?.entity ?? {}, 'processed');
    case 'refund.failed':
      return refundService.applyRefundEvent(p.refund?.entity ?? {}, 'failed');
    default:
      return 'ignored';
  }
}

/** Claims an event id; returns the claim or null when it was already handled. */
async function claimEvent(eventId, event) {
  try {
    return await WebhookEvent.create({ provider: 'razorpay', eventId, event });
  } catch (err) {
    if (!isDuplicateKeyError(err)) throw err;
  }
  const staleBefore = new Date(Date.now() - STALE_CLAIM_MS);
  return WebhookEvent.findOneAndUpdate(
    {
      provider: 'razorpay',
      eventId,
      $or: [{ status: 'failed' }, { status: 'processing', updatedAt: { $lt: staleBefore } }],
    },
    { $set: { status: 'processing' }, $unset: { error: 1 } },
    { returnDocument: 'after' },
  );
}

export const paymentService = {
  async config() {
    const settings = await settingsService.get();
    return {
      razorpayEnabled: razorpay.isEnabled(),
      keyId: razorpay.isEnabled() ? razorpay.publicKey() : null,
      codEnabled: settings.codEnabled,
    };
  },

  /** Verifies the Checkout handler response. The client's claim alone is never trusted. */
  async verify(userId, { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const { order, payment } = await loadOwnedPayment(userId, orderId, razorpayOrderId);
    const fail = async (description) => {
      await recordFailure(payment, { razorpayPaymentId, status: 'verification_failed', description, source: 'verify' });
      return AppError.badRequest('Payment verification failed');
    };

    if (!razorpay.verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
      throw await fail('Signature mismatch');
    }
    if (SETTLED.includes(order.paymentStatus)) return toCustomerOrder(order);

    let method;
    try {
      const remote = await razorpay.fetchPayment(razorpayPaymentId);
      if (remote.order_id && remote.order_id !== razorpayOrderId) throw await fail('Payment belongs to another order');
      if (!['captured', 'authorized'].includes(remote.status)) throw await fail(`Payment status is ${remote.status}`);
      if (Number(remote.amount) !== toPaise(payment.amount)) throw await fail('Amount mismatch');
      method = remote.method;
    } catch (err) {
      if (err instanceof AppError && err.statusCode === 400) throw err;
      // Gateway unreachable: the HMAC signature is proof enough.
      logger.warn({ err, orderId }, 'Could not fetch payment from gateway; trusting verified signature');
    }

    const confirmed = await orderLifecycle.confirmPayment({ order, razorpayPaymentId, source: 'verify', method });
    return toCustomerOrder(confirmed);
  },

  async recordClientFailure(userId, { orderId, razorpayOrderId, cancelled, error }) {
    const { order, payment } = await loadOwnedPayment(userId, orderId, razorpayOrderId);
    if (!SETTLED.includes(order.paymentStatus) && payment.status !== PAYMENT_RECORD_STATUS.CAPTURED) {
      await recordFailure(payment, {
        razorpayPaymentId: error?.paymentId,
        status: cancelled ? 'cancelled' : 'failed',
        code: error?.code,
        description: [error?.description, error?.reason].filter(Boolean).join(' – ') || undefined,
        source: 'client',
      });
    }
    return toCustomerOrder(await Order.findById(order._id));
  },

  /**
   * Razorpay webhook entry point.
   * @returns {Promise<string>} outcome message
   */
  async handleWebhook({ rawBody, signature, eventId }) {
    const raw = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(typeof rawBody === 'string' ? rawBody : '');
    if (!razorpay.verifyWebhookSignature(raw, signature)) throw AppError.badRequest('Invalid webhook signature');

    let payload;
    try {
      payload = JSON.parse(raw.toString('utf8'));
    } catch {
      throw AppError.badRequest('Malformed webhook payload');
    }
    const id = eventId || sha256(raw);
    const claim = await claimEvent(id, String(payload.event ?? 'unknown'));
    if (!claim) return 'Event already processed';

    try {
      const outcome = await dispatch(payload);
      await WebhookEvent.updateOne({ _id: claim._id }, { $set: { status: 'processed' } });
      logger.info({ eventId: id, event: payload.event, outcome }, 'Webhook processed');
      return outcome;
    } catch (err) {
      // Release the claim so Razorpay's retry can reprocess the event.
      await WebhookEvent.deleteOne({ _id: claim._id }).catch(() => {});
      throw err;
    }
  },

  // ---------------------------------------------------------------- admin

  async adminList({ page, limit, q, status, method, from, to }) {
    const p = getPagination({ page, limit });
    const filter = {
      ...(status && { status }),
      ...(method && { method }),
      ...((from || to) && { createdAt: { ...(from && { $gte: from }), ...(to && { $lte: to }) } }),
    };
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' };
      const orders = await Order.find({ orderNumber: rx }).select('_id').limit(200).lean();
      filter.$or = [{ razorpayOrderId: rx }, { razorpayPaymentId: rx }, { order: { $in: orders.map((o) => o._id) } }];
    }
    const [items, total, [sums]] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(p.skip)
        .limit(p.limit)
        .populate('order', 'orderNumber status')
        .populate('user', 'name email')
        .lean(),
      Payment.countDocuments(filter),
      Payment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            capturedAmount: {
              $sum: { $cond: [{ $in: ['$status', ['captured', 'refunded', 'partially_refunded']] }, '$amount', 0] },
            },
            refundedAmount: { $sum: '$amountRefunded' },
            failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
      ]),
    ]);
    return {
      items,
      pagination: buildPagination({ ...p, total }),
      meta: {
        capturedAmount: Math.round((sums?.capturedAmount ?? 0) * 100) / 100,
        refundedAmount: Math.round((sums?.refundedAmount ?? 0) * 100) / 100,
        failedCount: sums?.failedCount ?? 0,
      },
    };
  },

  async adminGet(id) {
    const payment = await Payment.findById(id)
      .populate('order', 'orderNumber status paymentStatus pricing')
      .populate('user', 'name email phone')
      .lean();
    if (!payment) throw AppError.notFound('Payment not found');
    return payment;
  },
};
