import { Cart, Inventory, MAX_QTY_PER_ITEM, Product, ProductVariant } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { couponService } from './coupon.service.js';
import { pricingService } from './pricing.service.js';

const MAX_LINES = 50;

const getCart = (userId) =>
  Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [], couponCode: null } },
    { upsert: true, returnDocument: 'after' },
  ).lean();

const toLines = (cart) => cart.items.map((i) => ({ _id: i._id, variantId: i.variant, quantity: i.quantity }));

/** Loads a purchasable variant (active, product published) with its available stock. */
async function loadPurchasable(variantId) {
  const variant = await ProductVariant.findOne({ _id: variantId, isActive: true }).select('product sku').lean();
  const product = variant && (await Product.exists({ _id: variant.product, isPublished: true }));
  if (!variant || !product) throw AppError.notFound('This product is no longer available');
  const inv = await Inventory.findOne({ variant: variant._id }).select('available').lean();
  return { variant, available: Math.max(0, inv?.available ?? 0) };
}

const clamp = (qty, available) => Math.max(1, Math.min(qty, MAX_QTY_PER_ITEM, available > 0 ? available : MAX_QTY_PER_ITEM));

async function render(userId, cart) {
  const view = await pricingService.buildCartView({ lines: toLines(cart), couponCode: cart.couponCode, userId });
  if (!view.couponError || !cart.couponCode) return view;
  // Stale coupon: surface the reason once and drop it from the cart.
  await Cart.updateOne({ _id: cart._id, couponCode: cart.couponCode }, { $set: { couponCode: null } });
  const fresh = await pricingService.buildCartView({ lines: toLines(cart), couponCode: null, userId });
  fresh.couponError = view.couponError;
  return fresh;
}

/** Adds (or merges) a quantity for a variant using atomic, retry-safe updates. */
async function addQuantity(userId, variantId, quantity, { strict }) {
  const { variant, available } = await loadPurchasable(variantId);
  if (available <= 0) {
    if (strict) throw AppError.conflict('This item is out of stock');
    return;
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const cart = await getCart(userId);
    const line = cart.items.find((i) => String(i.variant) === String(variant._id));
    if (line) {
      const next = Math.min(line.quantity + quantity, MAX_QTY_PER_ITEM, available);
      const res = await Cart.updateOne(
        { _id: cart._id, items: { $elemMatch: { _id: line._id, quantity: line.quantity } } },
        { $set: { 'items.$.quantity': Math.max(next, 1) } },
      );
      if (res.matchedCount) return;
    } else {
      if (cart.items.length >= MAX_LINES) throw AppError.conflict(`Your cart can hold at most ${MAX_LINES} different items`);
      const res = await Cart.updateOne(
        { _id: cart._id, 'items.variant': { $ne: variant._id }, [`items.${MAX_LINES - 1}`]: { $exists: false } },
        { $push: { items: { product: variant.product, variant: variant._id, quantity: clamp(quantity, available), addedAt: new Date() } } },
      );
      if (res.modifiedCount) return;
    }
  }
  throw AppError.conflict('Your cart was updated concurrently, please retry');
}

export const cartService = {
  async get(userId) {
    return render(userId, await getCart(userId));
  },

  async addItem(userId, { variantId, quantity }) {
    await addQuantity(userId, variantId, quantity, { strict: true });
    return this.get(userId);
  },

  async updateItem(userId, itemId, quantity) {
    const cart = await getCart(userId);
    const line = cart.items.find((i) => String(i._id) === String(itemId));
    if (!line) throw AppError.notFound('Cart item not found');
    const inv = await Inventory.findOne({ variant: line.variant }).select('available').lean();
    await Cart.updateOne(
      { _id: cart._id, 'items._id': line._id },
      { $set: { 'items.$.quantity': clamp(quantity, Math.max(0, inv?.available ?? 0)) } },
    );
    return this.get(userId);
  },

  async removeItem(userId, itemId) {
    const res = await Cart.updateOne({ user: userId, 'items._id': itemId }, { $pull: { items: { _id: itemId } } });
    if (!res.matchedCount) throw AppError.notFound('Cart item not found');
    return this.get(userId);
  },

  async clear(userId) {
    await Cart.updateOne({ user: userId }, { $set: { items: [], couponCode: null } }, { upsert: true });
    return this.get(userId);
  },

  /** Merges a guest cart after login (quantities are summed and clamped). */
  async merge(userId, items) {
    for (const { variantId, quantity } of items) {
      try {
        await addQuantity(userId, variantId, quantity, { strict: false });
      } catch (err) {
        if (!(err instanceof AppError)) throw err;
        if (err.message.startsWith('Your cart can hold')) break;
        // Unavailable / out-of-stock guest items are skipped silently.
      }
    }
    return this.get(userId);
  },

  async applyCoupon(userId, code) {
    const cart = await getCart(userId);
    const base = await pricingService.buildCartView({ lines: toLines(cart), userId });
    if (!base.lines.length) throw AppError.unprocessable('Add items to your cart before applying a coupon');
    const { coupon } = await couponService.validateForUser(code, { userId, subtotal: base.summary.subtotal });
    await Cart.updateOne({ _id: cart._id }, { $set: { couponCode: coupon.code } });
    return this.get(userId);
  },

  async removeCoupon(userId) {
    await Cart.updateOne({ user: userId }, { $set: { couponCode: null } });
    return this.get(userId);
  },

  /** Server-side priced view for a guest cart (line `_id` = variantId). */
  async preview({ items, couponCode }, userId) {
    const merged = new Map();
    for (const { variantId, quantity } of items) {
      merged.set(variantId, Math.min(MAX_QTY_PER_ITEM, (merged.get(variantId) ?? 0) + quantity));
    }
    const lines = [...merged].map(([variantId, quantity]) => ({ _id: variantId, variantId, quantity }));
    return pricingService.buildCartView({ lines, couponCode: couponCode || null, userId });
  },

  /** Empties the cart after a successful checkout. */
  async clearAfterCheckout(userId) {
    await Cart.updateOne({ user: userId }, { $set: { items: [], couponCode: null } });
  },
};
