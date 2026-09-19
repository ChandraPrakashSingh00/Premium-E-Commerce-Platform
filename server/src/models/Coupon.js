import mongoose from 'mongoose';
import { COUPON_TYPE } from '../constants/index.js';
import { baseToJSON } from './shared.schema.js';

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
      match: [/^[A-Z0-9_-]+$/, 'Coupon code may only contain letters, numbers, - and _'],
    },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    discountType: { type: String, enum: Object.values(COUPON_TYPE), required: true },
    /** Percentage (1-100) or fixed rupee amount depending on discountType. */
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    /** Cap for percentage coupons (0 = no cap). */
    maxDiscount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    /** Total redemptions allowed (0 = unlimited). */
    usageLimit: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    perUserLimit: { type: Number, default: 1, min: 1 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: baseToJSON, toObject: { virtuals: true } },
);

couponSchema.virtual('isExpired').get(function isExpired() {
  return this.expiresAt < new Date();
});

couponSchema.pre('validate', function checkValues() {
  if (this.discountType === COUPON_TYPE.PERCENTAGE && this.discountValue > 100) {
    this.invalidate('discountValue', 'Percentage discount cannot exceed 100');
  }
  if (this.startsAt && this.expiresAt && this.expiresAt <= this.startsAt) {
    this.invalidate('expiresAt', 'Expiry date must be after start date');
  }
});

couponSchema.index({ isActive: 1, expiresAt: 1 });

export const Coupon = mongoose.model('Coupon', couponSchema);
