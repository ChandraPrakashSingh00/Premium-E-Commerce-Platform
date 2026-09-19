import mongoose from 'mongoose';
import { REVIEW_STATUS } from '../constants/index.js';
import { baseToJSON, imageSchema } from './shared.schema.js';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
    images: { type: [imageSchema], default: [], validate: [(v) => v.length <= 5, 'Maximum 5 images'] },
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0, min: 0 },
    helpfulBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [], select: false },
    status: { type: String, enum: Object.values(REVIEW_STATUS), default: REVIEW_STATUS.PENDING },
    adminReply: { type: String, trim: true, maxlength: 1000 },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    moderatedAt: Date,
  },
  { timestamps: true, toJSON: baseToJSON },
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });
reviewSchema.index({ product: 1, status: 1, helpfulCount: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ status: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
