import mongoose from 'mongoose';

/**
 * Immutable snapshot of a purchased line, embedded in Order.
 * Prices are copied at checkout time so later catalogue edits never change history.
 */
export const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: String,
    sku: { type: String, required: true },
    size: String,
    color: String,
    brandName: String,
    /** Unit price (tax exclusive). */
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    taxRate: { type: Number, default: 0 },
    /** price * quantity */
    lineSubtotal: { type: Number, required: true, min: 0 },
    /** Share of the coupon discount allocated to this line. */
    discountAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    /** lineSubtotal - discountAmount + taxAmount */
    lineTotal: { type: Number, required: true, min: 0 },
    isReviewed: { type: Boolean, default: false },
  },
  { _id: true },
);
