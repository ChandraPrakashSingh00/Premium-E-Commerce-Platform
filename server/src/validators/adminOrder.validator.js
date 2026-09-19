import { z } from 'zod';
import { ORDER_STATUS, PAYMENT_METHOD, PAYMENT_STATUS } from '../constants/index.js';
import { dateFrom, dateTo, paginationQuery, searchText } from './common.validator.js';

const trackingFields = z.object({
  carrier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(80).optional(),
  trackingUrl: z.string().trim().url('Enter a valid tracking URL').max(500).optional().or(z.literal('')),
  estimatedDelivery: z.coerce.date().optional(),
});

export const listAdminOrdersQuery = paginationQuery.extend({
  q: searchText.optional(),
  status: z.enum(Object.values(ORDER_STATUS)).optional(),
  paymentStatus: z.enum(Object.values(PAYMENT_STATUS)).optional(),
  paymentMethod: z.enum(Object.values(PAYMENT_METHOD)).optional(),
  from: dateFrom.optional(),
  to: dateTo.optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(Object.values(ORDER_STATUS)),
  note: z.string().trim().max(500).optional(),
  tracking: trackingFields.optional(),
});

export const updateTrackingSchema = trackingFields.refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const adminCancelSchema = z.object({ reason: z.string().trim().min(3, 'Give a cancellation reason').max(500) });

export const resolveReturnSchema = z.object({
  action: z.enum(['approve', 'reject', 'complete']),
  note: z.string().trim().max(500).optional(),
});

export const refundSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0').optional(),
  reason: z.string().trim().max(300).optional(),
});

export const paymentStatusSchema = z.object({ paymentStatus: z.literal(PAYMENT_STATUS.PAID) });

export const adminNoteSchema = z.object({ adminNote: z.string().trim().max(1000) });
