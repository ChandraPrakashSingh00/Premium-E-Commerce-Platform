import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: {
      type: [wishlistItemSchema],
      default: [],
      validate: [(v) => v.length <= 200, 'Wishlist cannot contain more than 200 items'],
    },
  },
  { timestamps: true, versionKey: false },
);

wishlistSchema.index({ 'items.product': 1 });

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
