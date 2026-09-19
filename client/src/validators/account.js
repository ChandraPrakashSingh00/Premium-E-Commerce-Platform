import { z } from 'zod';
import { INDIAN_STATES } from '@/constants';
import { nameSchema, optionalPhoneSchema, phoneSchema } from './auth';

export const profileSchema = z.object({
  name: nameSchema,
  phone: optionalPhoneSchema,
});

const optionalText = (max, label) => z.string().trim().max(max, `${label} is too long`).optional().or(z.literal(''));

export const ADDRESS_LABELS = [
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'other', label: 'Other' },
];

/** Indian shipping address (mirrors server/src/validators/address.validator.js, stricter PIN rule). */
export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required').max(80, 'Name is too long'),
  phone: phoneSchema,
  addressLine1: z.string().trim().min(3, 'Address is required').max(200, 'Address is too long'),
  addressLine2: optionalText(200, 'Address line 2'),
  landmark: optionalText(100, 'Landmark'),
  city: z.string().trim().min(2, 'City is required').max(80, 'City is too long'),
  state: z
    .string()
    .trim()
    .min(1, 'Select a state')
    .refine((v) => INDIAN_STATES.includes(v), 'Select a valid state'),
  postalCode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit PIN code'),
  country: z.string().trim().default('India'),
  label: z.enum(['home', 'work', 'other']).default('home'),
  isDefault: z.boolean().optional(),
});

export const EMPTY_ADDRESS = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  label: 'home',
  isDefault: false,
};

export const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery is taking too long',
  'Want to change address or items',
  'Changed my mind',
  'Other',
];

export const RETURN_REASONS = [
  'Size or fit is not right',
  'Item is damaged or defective',
  'Received the wrong item',
  'Quality not as expected',
  'Item does not match the description',
  'Other',
];

const withNote = (reasons) =>
  z
    .object({
      reason: z.string().min(1, 'Choose a reason'),
      note: z.string().trim().max(400, 'Keep it under 400 characters').optional().or(z.literal('')),
    })
    .refine((v) => v.reason !== 'Other' || (v.note ?? '').trim().length >= 3, {
      message: 'Tell us a little more',
      path: ['note'],
    })
    .refine((v) => reasons.includes(v.reason), { message: 'Choose a reason', path: ['reason'] });

export const cancelOrderSchema = withNote(CANCEL_REASONS);

/** `note` is sent as the return `comment`. */
export const returnOrderSchema = withNote(RETURN_REASONS);

/** Builds the `reason` string sent to the API (server: 3–500 chars). */
export const composeReason = ({ reason, note }) => {
  const extra = (note ?? '').trim();
  if (!extra) return reason;
  return (reason === 'Other' ? extra : `${reason} – ${extra}`).slice(0, 500);
};
