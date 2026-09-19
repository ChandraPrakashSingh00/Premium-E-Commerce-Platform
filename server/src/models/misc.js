import mongoose from 'mongoose';

/** Atomic sequence generator (order numbers). */
const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } }, { versionKey: false });
export const Counter = mongoose.model('Counter', counterSchema);

/** Singleton store settings document (key = "store"). */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'store' },
    storeName: { type: String, default: 'BlueMart', trim: true, maxlength: 80 },
    supportEmail: { type: String, default: 'support@bluemart.store', trim: true },
    supportPhone: { type: String, default: '+91 98765 43210', trim: true },
    address: { type: String, default: '4th Floor, Indiranagar, Bengaluru 560038', trim: true },
    currency: { type: String, default: 'INR' },
    announcement: { type: String, default: 'Free Shipping on Orders Above ₹999', trim: true, maxlength: 160 },
    freeShippingThreshold: { type: Number, default: 999, min: 0 },
    shippingFee: { type: Number, default: 79, min: 0 },
    codEnabled: { type: Boolean, default: true },
    codFee: { type: Number, default: 0, min: 0 },
    codMaxOrderAmount: { type: Number, default: 50000, min: 0 },
    returnWindowDays: { type: Number, default: 7, min: 0, max: 60 },
    reservationTtlMinutes: { type: Number, default: 30, min: 5, max: 1440 },
    defaultLowStockThreshold: { type: Number, default: 5, min: 0 },
    requireReviewModeration: { type: Boolean, default: true },
    social: {
      instagram: { type: String, default: 'https://instagram.com' },
      facebook: { type: String, default: 'https://facebook.com' },
      twitter: { type: String, default: 'https://x.com' },
      youtube: { type: String, default: 'https://youtube.com' },
    },
  },
  { timestamps: true, versionKey: false },
);
export const Setting = mongoose.model('Setting', settingSchema);

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    isActive: { type: Boolean, default: true },
    source: { type: String, maxlength: 40, default: 'footer' },
  },
  { timestamps: true, versionKey: false },
);
export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSchema);

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 3000 },
    status: { type: String, enum: ['new', 'read', 'resolved'], default: 'new' },
  },
  { timestamps: true, versionKey: false },
);
contactMessageSchema.index({ status: 1, createdAt: -1 });
export const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
