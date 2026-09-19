import mongoose from 'mongoose';
import { baseToJSON } from './shared.schema.js';

export const addressFields = {
  fullName: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  addressLine1: { type: String, required: true, trim: true, maxlength: 200 },
  addressLine2: { type: String, trim: true, maxlength: 200, default: '' },
  landmark: { type: String, trim: true, maxlength: 100, default: '' },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  state: { type: String, required: true, trim: true, maxlength: 80 },
  postalCode: { type: String, required: true, trim: true, maxlength: 12 },
  country: { type: String, required: true, trim: true, maxlength: 60, default: 'India' },
};

const addressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ...addressFields,
    label: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: baseToJSON },
);

addressSchema.index({ user: 1, isDefault: -1, updatedAt: -1 });

export const Address = mongoose.model('Address', addressSchema);
