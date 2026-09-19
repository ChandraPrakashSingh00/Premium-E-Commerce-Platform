import { z } from 'zod';
import { email } from './common.validator.js';

export const newsletterSchema = z.object({
  email,
  source: z.string().trim().max(40).regex(/^[\w-]*$/, 'Invalid source').optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  email,
  subject: z.string().trim().min(3, 'Subject is required').max(150),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000),
});
