import mongoose from 'mongoose';

/**
 * One document per redemption. `slot` (1..perUserLimit) + the unique index on
 * (coupon, user, slot) makes the per-user limit race-safe; (order) unique makes
 * redemption idempotent per order.
 */
const couponUsageSchema = new mongoose.Schema(
  {
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    slot: { type: Number, required: true, min: 1 },
    discountAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, versionKey: false },
);

couponUsageSchema.index({ coupon: 1, user: 1, slot: 1 }, { unique: true });
couponUsageSchema.index({ coupon: 1, createdAt: -1 });

export const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);
