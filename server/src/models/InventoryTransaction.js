import mongoose from 'mongoose';
import { INVENTORY_TXN } from '../constants/index.js';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    sku: { type: String, required: true },
    type: { type: String, enum: Object.values(INVENTORY_TXN), required: true },
    /** Signed quantity change applied to `available` (RESERVE is negative, RELEASE positive...). */
    quantity: { type: Number, required: true },
    availableAfter: Number,
    reservedAfter: Number,
    soldAfter: Number,
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    reason: { type: String, trim: true, maxlength: 300 },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false },
);

inventoryTransactionSchema.index({ inventory: 1, createdAt: -1 });
inventoryTransactionSchema.index({ product: 1, createdAt: -1 });
inventoryTransactionSchema.index({ type: 1, createdAt: -1 });
/** Idempotency: an order moves each variant through each state at most once. */
inventoryTransactionSchema.index(
  { order: 1, variant: 1, type: 1 },
  { unique: true, partialFilterExpression: { order: { $exists: true } } },
);

export const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);
