import mongoose from 'mongoose';
import { PAYMENT_METHOD, PAYMENT_RECORD_STATUS } from '../constants/index.js';
import { baseToJSON } from './shared.schema.js';

const attemptSchema = new mongoose.Schema(
  {
    razorpayPaymentId: String,
    status: String,
    method: String,
    errorCode: String,
    errorDescription: String,
    source: { type: String, enum: ['client', 'webhook', 'verify', 'system'] },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const refundSchema = new mongoose.Schema(
  {
    razorpayRefundId: String,
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    reason: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    method: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    status: { type: String, enum: Object.values(PAYMENT_RECORD_STATUS), default: PAYMENT_RECORD_STATUS.CREATED },
    /** Amount in rupees. */
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },

    razorpayOrderId: { type: String, unique: true, sparse: true },
    razorpayPaymentId: { type: String, index: { sparse: true } },
    paymentMode: String,
    attempts: { type: [attemptSchema], default: [] },

    amountRefunded: { type: Number, default: 0, min: 0 },
    refunds: { type: [refundSchema], default: [] },
    failureReason: String,
    capturedAt: Date,
  },
  { timestamps: true, toJSON: baseToJSON },
);

paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
