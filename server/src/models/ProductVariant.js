import mongoose from 'mongoose';
import { attributeSchema, baseToJSON, imageSchema } from './shared.schema.js';

/**
 * A purchasable SKU. Stock numbers live in Inventory (source of truth);
 * `stock` here is a denormalised copy of Inventory.available for fast reads.
 */
const variantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 60 },
    title: { type: String, trim: true, maxlength: 120 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0, default: 0 },
    size: { type: String, trim: true, maxlength: 20 },
    color: { type: String, trim: true, maxlength: 40 },
    colorHex: { type: String, trim: true, maxlength: 9 },
    images: { type: [imageSchema], default: [] },
    attributes: { type: [attributeSchema], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: baseToJSON, toObject: { virtuals: true } },
);

variantSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

variantSchema.pre('validate', function buildTitle() {
  if (!this.title) this.title = [this.color, this.size].filter(Boolean).join(' / ') || 'Default';
});

variantSchema.index({ product: 1, isActive: 1, position: 1 });
variantSchema.index({ product: 1, size: 1, color: 1 }, { unique: true });

export const ProductVariant = mongoose.model('ProductVariant', variantSchema);
