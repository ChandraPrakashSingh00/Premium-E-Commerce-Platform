import { logger } from '../config/logger.js';
import { paymentService } from '../services/payment.service.js';
import { AppError } from '../utils/AppError.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPaymentConfig = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await paymentService.config() });
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const order = await paymentService.verify(req.user._id, req.body);
  sendSuccess(res, { data: { order }, message: 'Payment verified' });
});

export const recordRazorpayFailure = asyncHandler(async (req, res) => {
  const order = await paymentService.recordClientFailure(req.user._id, req.body);
  sendSuccess(res, { data: { order }, message: 'Payment attempt recorded' });
});

/**
 * Razorpay webhook. Mounted in app.js with express.raw(), so req.body is a Buffer.
 * Returns 5xx on internal errors so Razorpay retries the delivery.
 */
export async function razorpayWebhook(req, res) {
  try {
    const message = await paymentService.handleWebhook({
      rawBody: req.body,
      signature: req.get('x-razorpay-signature'),
      eventId: req.get('x-razorpay-event-id'),
    });
    return sendSuccess(res, { message });
  } catch (err) {
    if (err instanceof AppError && err.statusCode < 500) {
      logger.warn({ message: err.message }, 'Rejected Razorpay webhook');
      return sendError(res, { statusCode: err.statusCode, message: err.message, code: err.code });
    }
    logger.error({ err }, 'Razorpay webhook processing failed');
    return sendError(res, { statusCode: 500, message: 'Webhook processing failed', code: 'INTERNAL_ERROR' });
  }
}
