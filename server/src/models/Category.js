import mongoose from 'mongoose';
import { baseToJSON, imageSchema, seoSchema } from './shared.schema.js';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    image: imageSchema,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    isPublished: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    productCount: { type: Number, default: 0, min: 0 },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true, toJSON: baseToJSON, toObject: { virtuals: true } },
);

categorySchema.index({ isPublished: 1, sortOrder: 1 });
categorySchema.index({ name: 1, parent: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);
