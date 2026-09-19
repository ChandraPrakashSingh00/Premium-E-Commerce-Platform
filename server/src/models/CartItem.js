import mongoose from 'mongoose';

/**
 * Embedded in Cart. Only references + quantity are stored; prices are always
 * recalculated on the server from the current variant data.
 */
export const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

export const MAX_QTY_PER_ITEM = 10;
