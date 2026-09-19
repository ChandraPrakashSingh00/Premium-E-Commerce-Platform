import mongoose from 'mongoose';
import { baseToJSON } from './shared.schema.js';

/**
 * Stock ledger per variant. All mutations go through inventory.service using
 * conditional atomic updates ($inc guarded by `available >= qty`) so stock can
 * never go negative, even under concurrent checkouts.
 */
const inventorySchema = new mongoose.Schema(
  {
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true, unique: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, uppercase: true, trim: true, index: true },
    available: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
  },
  { timestamps: true, toJSON: baseToJSON, toObject: { virtuals: true } },
);

inventorySchema.virtual('isLowStock').get(function isLowStock() {
  return this.available <= this.lowStockThreshold;
});

inventorySchema.index({ available: 1 });

export const Inventory = mongoose.model('Inventory', inventorySchema);
