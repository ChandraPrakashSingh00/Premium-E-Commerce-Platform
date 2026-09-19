import { z } from 'zod';
import { email, paginationQuery, phone } from './common.validator.js';

const money = z.number().min(0).max(10_000_000);
const socialUrl = z.union([z.string().trim().url('Enter a valid URL').max(300), z.literal('')]).optional();

/** Mirrors the editable fields of the Setting model (models/misc.js). */
export const updateSettingsSchema = z
  .object({
    storeName: z.string().trim().min(2).max(80).optional(),
    supportEmail: email.optional(),
    supportPhone: phone.optional(),
    address: z.string().trim().max(300).optional(),
    currency: z.literal('INR').optional(),
    announcement: z.string().trim().max(160).optional(),
    freeShippingThreshold: money.optional(),
    shippingFee: money.optional(),
    codEnabled: z.boolean().optional(),
    codFee: money.optional(),
    codMaxOrderAmount: money.optional(),
    returnWindowDays: z.number().int().min(0).max(60).optional(),
    reservationTtlMinutes: z.number().int().min(5).max(1440).optional(),
    defaultLowStockThreshold: z.number().int().min(0).max(100_000).optional(),
    requireReviewModeration: z.boolean().optional(),
    social: z
      .object({ instagram: socialUrl, facebook: socialUrl, twitter: socialUrl, youtube: socialUrl })
      .optional(),
  })
  .refine((v) => Object.values(v).some((x) => x !== undefined), 'Nothing to update');

const MESSAGE_STATUS = ['new', 'read', 'resolved'];

export const messagesQuery = paginationQuery.extend({ status: z.enum(MESSAGE_STATUS).optional() });

export const updateMessageSchema = z.object({ status: z.enum(MESSAGE_STATUS) });
