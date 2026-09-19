import { z } from 'zod';
import { ORDER_STATUS_LABELS } from '@/constants';

/** Accepts empty strings or absolute http(s) URLs. */
const isHttpUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const trackingFieldsSchema = z.object({
  carrier: z.string().trim().max(60, 'Keep it under 60 characters'),
  trackingNumber: z.string().trim().max(80, 'Keep it under 80 characters'),
  trackingUrl: z.string().trim().max(500, 'URL is too long').refine(isHttpUrl, 'Enter a valid URL (https://…)'),
  estimatedDelivery: z.string(),
});

export const emptyTracking = (tracking = {}) => ({
  carrier: tracking?.carrier ?? '',
  trackingNumber: tracking?.trackingNumber ?? '',
  trackingUrl: tracking?.trackingUrl ?? '',
  estimatedDelivery: tracking?.estimatedDelivery ? String(tracking.estimatedDelivery).slice(0, 10) : '',
});

/** Tracking form values → API body (empty date is omitted, other fields may be cleared). */
export const toTrackingBody = (values) => ({
  carrier: values.carrier.trim(),
  trackingNumber: values.trackingNumber.trim(),
  trackingUrl: values.trackingUrl.trim(),
  estimatedDelivery: values.estimatedDelivery || undefined,
});

/**
 * Status update form. Cancelling goes through the dedicated cancel endpoint (stock release + refund),
 * so the note becomes a required reason in that case.
 */
export const statusUpdateSchema = z
  .object({
    status: z.string().min(1, 'Choose a new status'),
    note: z.string().trim().max(500, 'Keep the note under 500 characters'),
    tracking: trackingFieldsSchema,
  })
  .superRefine((values, ctx) => {
    if (values.status === 'cancelled' && values.note.length < 3) {
      ctx.addIssue({ code: 'custom', path: ['note'], message: 'Give a cancellation reason (min 3 characters)' });
    }
    if (values.status === 'shipped') {
      if (!values.tracking.carrier.trim()) ctx.addIssue({ code: 'custom', path: ['tracking', 'carrier'], message: 'Carrier is required' });
      if (!values.tracking.trackingNumber.trim()) {
        ctx.addIssue({ code: 'custom', path: ['tracking', 'trackingNumber'], message: 'Tracking number is required' });
      }
    }
  });

export const statusOptions = (statuses = []) => statuses.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] ?? value }));

export const cancelSchema = z.object({
  reason: z.string().trim().min(3, 'Give a cancellation reason (min 3 characters)').max(500, 'Keep it under 500 characters'),
});

export const noteSchema = z.object({ note: z.string().trim().max(500, 'Keep the note under 500 characters') });

export const adminNoteSchema = z.object({ adminNote: z.string().trim().max(1000, 'Keep the note under 1000 characters') });

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Amount already refunded (max of the payment record and the order's refund summary). */
export const refundedAmount = (order) => {
  const fromPayment = Number(order?.payment?.amountRefunded) || 0;
  const fromOrder = ['processed', 'pending'].includes(order?.refund?.status) ? Number(order?.refund?.amount) || 0 : 0;
  return round2(Math.max(fromPayment, fromOrder));
};

export const refundableAmount = (order) => Math.max(0, round2((order?.pricing?.total ?? 0) - refundedAmount(order)));

export const refundSchema = (max) =>
  z.object({
    amount: z.coerce
      .number({ error: 'Enter an amount' })
      .positive('Amount must be greater than 0')
      .max(max, `You can refund at most ₹${max}`)
      .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Use at most 2 decimals'),
    reason: z.string().trim().max(300, 'Keep it under 300 characters'),
  });

/** Which header actions apply to an order. */
export function orderActions(order) {
  const allowed = order?.allowedTransitions ?? [];
  const refundable = refundableAmount(order);
  return {
    canCancel: allowed.includes('cancelled'),
    canMarkPaid: order?.paymentMethod === 'cod' && order?.paymentStatus === 'pending' && order?.status !== 'cancelled',
    canRefund: ['paid', 'partially_refunded'].includes(order?.paymentStatus) && refundable > 0 && order?.refund?.status !== 'pending',
    refundable,
  };
}
