import { z } from 'zod';

/**
 * Client-side mirrors of the server auth validators (server/src/validators/auth.validator.js).
 * The server stays the source of truth – these exist for instant, friendly feedback.
 */

const INDIAN_MOBILE = /^(?:\+?91)?[6-9]\d{9}$/;

/** Strips spaces, dashes and brackets so "+91 98765-43210" validates. */
export const normalizePhone = (value) => String(value ?? '').replace(/[\s()-]/g, '');

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .email('Enter a valid email address')
  .transform((v) => v.toLowerCase());

export const nameSchema = z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long');

/** Indian mobile number: 10 digits starting 6–9, optional +91 / 91 prefix. */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .refine((v) => INDIAN_MOBILE.test(normalizePhone(v)), 'Enter a valid 10-digit mobile number')
  .transform(normalizePhone);

/** Same as phoneSchema but an empty value is allowed (returned as ''). */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || INDIAN_MOBILE.test(normalizePhone(v)), 'Enter a valid 10-digit mobile number')
  .transform(normalizePhone);

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/\d/, 'Password must contain a number');

export const PASSWORD_RULES = [
  { id: 'length', label: '8+ characters', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Lowercase letter', test: (v) => /[a-z]/.test(v) },
  { id: 'digit', label: 'Number', test: (v) => /\d/.test(v) },
];

/** 0–4 score used by the strength meter (rules met + a bonus for length/symbols). */
export function passwordStrength(value = '') {
  if (!value) return { score: 0, label: '' };
  const met = PASSWORD_RULES.filter((r) => r.test(value)).length;
  let score = Math.max(0, met - 1); // 0..3
  if (met === PASSWORD_RULES.length && (value.length >= 12 || /[^A-Za-z0-9]/.test(value))) score = 4;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score] };
}

const matches = (field, confirmField, message = 'Passwords do not match') => ({
  check: (v) => v[field] === v[confirmField],
  opts: { message, path: [confirmField] },
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
});

const registerMatch = matches('password', 'confirmPassword');
export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: optionalPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.boolean().refine((v) => v === true, 'Please accept the terms to continue'),
  })
  .refine(registerMatch.check, registerMatch.opts);

export const forgotPasswordSchema = z.object({ email: emailSchema });

const resetMatch = matches('password', 'confirmPassword');
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(resetMatch.check, resetMatch.opts);

const changeMatch = matches('newPassword', 'confirmPassword');
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(128, 'Password is too long'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(changeMatch.check, changeMatch.opts)
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'New password must be different from the current password',
    path: ['newPassword'],
  });

/** Only allow same-origin relative redirects (prevents open redirects). */
export function safeRedirect(value, fallback = '/account') {
  if (!value || typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  return value;
}
