import mongoose from 'mongoose';
import {
  INVENTORY_STATE,
  ORDER_STATUS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  REFUND_STATUS,
  RETURN_STATUS,
} from '../constants/index.js';
import { addressFields } from './Address.js';
import { orderItemSchema } from './OrderItem.js';
import { baseToJSON } from './shared.schema.js';

const shippingAddressSchema = new mongoose.Schema(addressFields, { _id: false });

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUS), required: true },
    note: { type: String, trim: true, maxlength: 500 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    /** Client-generated key: retries of the same checkout return the same order. */
    idempotencyKey: { type: String, trim: true, maxlength: 100 },

    items: {
      type: [orderItemSchema],
      validate: [(v) => v.length > 0, 'Order must contain at least one item'],
    },
    contact: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },

    pricing: {
      subtotal: { type: Number, required: true, min: 0 },
      /** Savings vs. compareAtPrice (informational). */
      discount: { type: Number, default: 0, min: 0 },
      couponDiscount: { type: Number, default: 0, min: 0 },
      tax: { type: Number, default: 0, min: 0 },
      shipping: { type: Number, default: 0, min: 0 },
      codFee: { type: Number, default: 0, min: 0 },
      total: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR' },
    },
    coupon: {
      code: String,
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    },

    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHOD), required: true },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    paidAt: Date,

    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING },
    statusHistory: { type: [statusHistorySchema], default: [] },

    inventoryState: { type: String, enum: Object.values(INVENTORY_STATE), default: INVENTORY_STATE.RESERVED },
    /** Unpaid online orders are auto-cancelled (and stock released) after this time. */
    reservationExpiresAt: Date,

    tracking: {
      carrier: { type: String, trim: true, maxlength: 60 },
      trackingNumber: { type: String, trim: true, maxlength: 80 },
      trackingUrl: { type: String, trim: true, maxlength: 500 },
      estimatedDelivery: Date,
      shippedAt: Date,
      deliveredAt: Date,
    },

    cancellation: {
      reason: { type: String, trim: true, maxlength: 500 },
      cancelledBy: { type: String, enum: ['customer', 'admin', 'system'] },
      cancelledAt: Date,
    },
    returnRequest: {
      status: { type: String, enum: Object.values(RETURN_STATUS) },
      reason: { type: String, trim: true, maxlength: 500 },
      comment: { type: String, trim: true, maxlength: 1000 },
      adminNote: { type: String, trim: true, maxlength: 500 },
      requestedAt: Date,
      resolvedAt: Date,
    },
    refund: {
      status: { type: String, enum: Object.values(REFUND_STATUS), default: REFUND_STATUS.NONE },
      amount: { type: Number, default: 0, min: 0 },
      razorpayRefundId: String,
      reason: String,
      initiatedAt: Date,
      processedAt: Date,
    },

    customerNote: { type: String, trim: true, maxlength: 500 },
    adminNote: { type: String, trim: true, maxlength: 1000 },
    /** Tracks which notification emails have been sent (idempotent notifications). */
    notificationsSent: { type: [String], default: [] },
  },
  { timestamps: true, toJSON: baseToJSON },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.product': 1 });
orderSchema.index({ 'contact.email': 1 });
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);
orderSchema.index(
  { reservationExpiresAt: 1 },
  { partialFilterExpression: { inventoryState: INVENTORY_STATE.RESERVED } },
);

export const Order = mongoose.model('Order', orderSchema);
