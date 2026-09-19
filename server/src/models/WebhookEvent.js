import mongoose from 'mongoose';

/** Stores processed webhook event ids so duplicate deliveries are ignored. */
const webhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, default: 'razorpay' },
    eventId: { type: String, required: true },
    event: { type: String, required: true },
    status: { type: String, enum: ['processing', 'processed', 'failed'], default: 'processing' },
    error: String,
  },
  { timestamps: true, versionKey: false },
);

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
