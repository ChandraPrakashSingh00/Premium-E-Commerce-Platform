import { z } from 'zod';
import { ORDER_STATUS, PAYMENT_METHOD } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';
import { email, objectId, paginationQuery, phone } from './common.validator.js';

const paymentMethod = z.enum(Object.values(PAYMENT_METHOD), { message: 'Choose a valid payment method' });

export const quoteSchema = z.object({ paymentMethod: paymentMethod.optional() });

export const placeOrderSchema = z.object({
  addressId: objectId,
  contact: z.object({
    name: z.string().trim().min(2, 'Enter your name').max(80),
    email,
    phone,
  }),
  paymentMethod,
  customerNote: z.string().trim().max(500).optional(),
});

export const listOrdersQuery = paginationQuery.extend({
  status: z.enum(Object.values(ORDER_STATUS)).optional(),
});

export const cancelOrderSchema = z.object({ reason: z.string().trim().min(3, 'Tell us why you are cancelling').max(500) });

export const returnOrderSchema = z.object({
  reason: z.string().trim().min(3, 'Tell us why you are returning the order').max(500),
  comment: z.string().trim().max(1000).optional(),
});

const IDEMPOTENCY_KEY = /^[A-Za-z0-9_:.-]{8,100}$/;

/** Requires an `X-Idempotency-Key` header (8–100 safe characters) and exposes it as req.idempotencyKey. */
export function requireIdempotencyKey(req, _res, next) {
  const key = req.get('x-idempotency-key');
  if (!key || !IDEMPOTENCY_KEY.test(key)) {
    return next(
      AppError.unprocessable('A valid X-Idempotency-Key header is required', [
        { field: 'headers.x-idempotency-key', message: 'Must be 8-100 characters (letters, numbers, - _ : .)' },
      ]),
    );
  }
  req.idempotencyKey = key;
  return next();
}
