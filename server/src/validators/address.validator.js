import { z } from 'zod';
import { objectId, phone } from './common.validator.js';

// No `.default()`s here: zod applies defaults inside `.partial()`, which would overwrite fields on update.
// Mongoose supplies the defaults on create.
const addressShape = {
  fullName: z.string().trim().min(2, 'Full name is required').max(80),
  phone,
  addressLine1: z.string().trim().min(3, 'Address is required').max(200),
  addressLine2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(100).optional(),
  city: z.string().trim().min(2, 'City is required').max(80),
  state: z.string().trim().min(2, 'State is required').max(80),
  postalCode: z.string().trim().regex(/^[A-Za-z0-9 -]{3,12}$/, 'Enter a valid postal code'),
  country: z.string().trim().min(2).max(60).optional(),
  label: z.enum(['home', 'work', 'other']).optional(),
  isDefault: z.boolean().optional(),
};

export const createAddressSchema = z.object(addressShape);

export const updateAddressSchema = z
  .object(addressShape)
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), 'Nothing to update');

export const addressIdParam = z.object({ id: objectId });
