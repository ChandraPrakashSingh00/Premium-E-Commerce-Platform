import mongoose from 'mongoose';
import { NOTIFICATION_TYPE } from '../constants/index.js';
import { baseToJSON } from './shared.schema.js';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NOTIFICATION_TYPE), required: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    link: { type: String, trim: true, maxlength: 300 },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    email: {
      status: { type: String, enum: ['skipped', 'queued', 'sent', 'failed'], default: 'skipped' },
      error: String,
      sentAt: Date,
    },
  },
  { timestamps: true, toJSON: baseToJSON },
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

export const Notification = mongoose.model('Notification', notificationSchema);
