import mongoose from 'mongoose';
import { attributeSchema, baseToJSON, imageSchema, seoSchema } from './shared.schema.js';

/**
 * Catalogue product. Purchasable units are ProductVariant documents (every product
 * has at least one; single-SKU products have one `isDefault` variant).
 * `price`, `compareAtPrice`, `stock` and `options` are denormalised from the variants
 * so listing/filter queries never need a join.
 */
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, trim: true, maxlength: 300, default: '' },
    description: { type: String, trim: true, maxlength: 10000, default: '' },
    images: { type: [imageSchema], default: [] },
    thumbnail: { type: String, trim: true, maxlength: 1000 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true },

    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 60 },
    /** Lowest active variant price (tax exclusive, INR). */
    price: { type: Number, required: true, min: 0 },
    /** MRP / strike-through price. */
    compareAtPrice: { type: Number, min: 0, default: 0 },
    /** Percentage off compareAtPrice (0-100), computed. */
    discount: { type: Number, min: 0, max: 100, default: 0 },
    /** GST rate in percent. */
    taxRate: { type: Number, min: 0, max: 40, default: 18 },

    attributes: { type: [attributeSchema], default: [] },
    options: {
      sizes: [{ type: String, trim: true, maxlength: 20 }],
      colors: [
        {
          _id: false,
          name: { type: String, trim: true, maxlength: 40 },
          hex: { type: String, trim: true, maxlength: 9 },
        },
      ],
    },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],

    /** Sum of available stock across active variants. */
    stock: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    ratingBreakdown: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },

    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    publishedAt: Date,

    shippingInfo: { type: String, trim: true, maxlength: 1000 },
    returnPolicy: { type: String, trim: true, maxlength: 1000 },
    seo: { type: seoSchema, default: () => ({}) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: baseToJSON, toObject: { virtuals: true } },
);

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.virtual('variants', { ref: 'ProductVariant', localField: '_id', foreignField: 'product' });

productSchema.pre('validate', function computeDerived() {
  this.discount =
    this.compareAtPrice > this.price && this.compareAtPrice > 0
      ? Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100)
      : 0;
  if (!this.thumbnail && this.images?.length) this.thumbnail = this.images[0].url;
  if (this.isPublished && !this.publishedAt) this.publishedAt = new Date();
});

// Storefront listing / filtering
productSchema.index({ isPublished: 1, category: 1, price: 1 });
productSchema.index({ isPublished: 1, subcategory: 1, price: 1 });
productSchema.index({ isPublished: 1, brand: 1, price: 1 });
productSchema.index({ isPublished: 1, createdAt: -1 });
productSchema.index({ isPublished: 1, soldCount: -1 });
productSchema.index({ isPublished: 1, ratingAverage: -1 });
productSchema.index({ isPublished: 1, discount: -1 });
productSchema.index({ isPublished: 1, isFeatured: 1 });
productSchema.index({ isPublished: 1, isBestSeller: 1 });
productSchema.index({ isPublished: 1, isNewArrival: 1 });
productSchema.index({ 'options.sizes': 1 });
productSchema.index({ 'options.colors.name': 1 });
productSchema.index({ stock: 1 });
productSchema.index(
  { name: 'text', tags: 'text', shortDescription: 'text', sku: 'text' },
  { weights: { name: 10, sku: 8, tags: 5, shortDescription: 1 }, name: 'product_text' },
);

export const Product = mongoose.model('Product', productSchema);
