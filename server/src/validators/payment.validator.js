import { z } from 'zod';
import { PAYMENT_METHOD, PAYMENT_RECORD_STATUS } from '../constants/index.js';
import { dateFrom, dateTo, objectId, paginationQuery, searchText } from './common.validator.js';

const gatewayId = (prefix) =>
  z
    .string()
    .trim()
    .min(prefix.length + 1)
    .max(64)
    .regex(/^[A-Za-z0-9_]+$/, 'Invalid identifier');

export const verifyPaymentSchema = z.object({
  orderId: objectId,
  razorpayOrderId: gatewayId('order_'),
  razorpayPaymentId: gatewayId('pay_'),
  razorpaySignature: z.string().trim().regex(/^[a-f0-9]{64}$/i, 'Invalid signature'),
});

export const paymentFailureSchema = z.object({
  orderId: objectId,
  razorpayOrderId: gatewayId('order_'),
  cancelled: z.boolean().optional().default(false),
  error: z
    .object({
      code: z.string().trim().max(100).optional(),
      description: z.string().trim().max(500).optional(),
      reason: z.string().trim().max(200).optional(),
      paymentId: z.string().trim().max(64).optional(),
    })
    .optional(),
});

export const listPaymentsQuery = paginationQuery.extend({
  q: searchText.optional(),
  status: z.enum(Object.values(PAYMENT_RECORD_STATUS)).optional(),
  method: z.enum(Object.values(PAYMENT_METHOD)).optional(),
  from: dateFrom.optional(),
  to: dateTo.optional(),
});
