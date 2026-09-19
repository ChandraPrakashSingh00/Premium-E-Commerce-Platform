import { z } from 'zod';
import { emailSchema, nameSchema, phoneSchema } from './auth';

export { addressSchema, EMPTY_ADDRESS } from './account';

/** Step 1 – who the order is for (sent as `contact`). */
export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
});

export const PAYMENT_METHODS = ['razorpay', 'cod'];

export const paymentSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHODS, { message: 'Choose a payment method' }),
  customerNote: z.string().trim().max(500, 'Keep your note under 500 characters').optional().or(z.literal('')),
});

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Enter a valid code')
    .max(30, 'Enter a valid code')
    .regex(/^[A-Za-z0-9_-]+$/, 'Codes contain only letters and numbers')
    .transform((v) => v.toUpperCase()),
});
