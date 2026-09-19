import mongoose from 'mongoose';
import { cartItemSchema } from './CartItem.js';

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: [(v) => v.length <= 50, 'Cart cannot contain more than 50 items'],
    },
    couponCode: { type: String, uppercase: true, trim: true, default: null },
  },
  { timestamps: true, versionKey: false },
);

export const Cart = mongoose.model('Cart', cartSchema);
