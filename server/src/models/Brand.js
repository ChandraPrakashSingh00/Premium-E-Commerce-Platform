import mongoose from 'mongoose';
import { baseToJSON, imageSchema, seoSchema } from './shared.schema.js';

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    logo: imageSchema,
    website: { type: String, trim: true, maxlength: 300 },
    isPublished: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    productCount: { type: Number, default: 0, min: 0 },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true, toJSON: baseToJSON },
);

export const Brand = mongoose.model('Brand', brandSchema);
