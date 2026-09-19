import { z } from 'zod';
import { email, password, phone } from './common.validator.js';

const name = z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long');
const token = z.string().trim().min(16, 'Invalid token').max(256, 'Invalid token');

export const registerSchema = z.object({
  name,
  email,
  password,
  phone: phone.optional(),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordParams = z.object({ token });
export const resetPasswordSchema = z.object({ password });

export const verifyEmailSchema = z.object({ token });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').max(128),
    newPassword: password,
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    path: ['newPassword'],
    message: 'New password must be different from the current password',
  });
