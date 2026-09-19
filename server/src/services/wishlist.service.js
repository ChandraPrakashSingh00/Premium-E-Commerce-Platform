import { Inventory, Product, ProductVariant, Wishlist } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { cartService } from './cart.service.js';

const MAX_ITEMS = 200;
const CARD_FIELDS =
  'name slug thumbnail images shortDescription brand category price compareAtPrice discount ratingAverage reviewCount stock isFeatured isBestSeller isNewArrival options';

/** Local ProductCard projection (see docs/api.md). */
function toCard(p, variants) {
  const active = variants.filter((v) => String(v.product) === String(p._id));
  const def = active.find((v) => v.isDefault) ?? active[0];
  const ref = (x) => (x ? { _id: x._id, name: x.name, slug: x.slug } : null);
  return {
    _id: p._id,
    name: p.name,
    slug: p.slug,
    thumbnail: p.thumbnail || p.images?.[0]?.url || '',
    images: (p.images ?? []).slice(0, 2).map((i) => ({ url: i.url, alt: i.alt ?? '' })),
    shortDescription: p.shortDescription ?? '',
    brand: ref(p.brand),
    category: ref(p.category),
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? 0,
    discount: p.discount ?? 0,
    ratingAverage: p.ratingAverage ?? 0,
    reviewCount: p.reviewCount ?? 0,
    stock: p.stock ?? 0,
    inStock: (p.stock ?? 0) > 0,
    isFeatured: Boolean(p.isFeatured),
    isBestSeller: Boolean(p.isBestSeller),
    isNewArrival: Boolean(p.isNewArrival),
    defaultVariantId: def?._id ?? null,
    variantCount: active.length,
    options: { sizes: p.options?.sizes ?? [], colors: p.options?.colors ?? [] },
  };
}

async function loadPublished(productId) {
  const product = await Product.findOne({ _id: productId, isPublished: true }).select('_id').lean();
  if (!product) throw AppError.notFound('Product not found');
  return product;
}

async function ensureWishlist(userId) {
  await Wishlist.updateOne({ user: userId }, { $setOnInsert: { user: userId, items: [] } }, { upsert: true });
}

/** Atomic add: never duplicates a product and never exceeds MAX_ITEMS. */
async function pushItem(userId, productId, variantId = null) {
  await Wishlist.updateOne(
    { user: userId, 'items.product': { $ne: productId }, [`items.${MAX_ITEMS - 1}`]: { $exists: false } },
    { $push: { items: { $each: [{ product: productId, variant: variantId, addedAt: new Date() }], $position: 0 } } },
  );
}

/** Picks the requested variant, else the default / first in-stock active variant. */
async function resolveVariant(productId, preferredId) {
  const variants = await ProductVariant.find({ product: productId, isActive: true })
    .select('isDefault position')
    .sort({ isDefault: -1, position: 1, createdAt: 1 })
    .lean();
  const inventories = await Inventory.find({ variant: { $in: variants.map((v) => v._id) } })
    .select('variant available')
    .lean();
  const stock = new Map(inventories.map((i) => [String(i.variant), i.available]));
  const inStock = (v) => (stock.get(String(v._id)) ?? 0) > 0;

  if (preferredId) {
    const chosen = variants.find((v) => String(v._id) === String(preferredId));
    if (chosen) {
      if (!inStock(chosen)) throw AppError.conflict('The selected option is out of stock');
      return chosen._id;
    }
  }
  const pick = variants.find(inStock);
  if (!pick) throw AppError.conflict('This product is out of stock');
  return pick._id;
}

export const wishlistService = {
  async get(userId) {
    const wishlist = await Wishlist.findOne({ user: userId }).lean();
    const entries = wishlist?.items ?? [];
    if (!entries.length) return { items: [] };
    const ids = entries.map((e) => e.product);
    const [products, variants] = await Promise.all([
      Product.find({ _id: { $in: ids }, isPublished: true })
        .select(CARD_FIELDS)
        .populate('brand', 'name slug')
        .populate('category', 'name slug')
        .lean(),
      ProductVariant.find({ product: { $in: ids }, isActive: true })
        .select('product isDefault position')
        .sort({ position: 1 })
        .lean(),
    ]);
    const map = new Map(products.map((p) => [String(p._id), p]));
    const items = entries
      .filter((e) => map.has(String(e.product)))
      .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
      .map((e) => ({
        product: toCard(map.get(String(e.product)), variants),
        variantId: e.variant ?? null,
        addedAt: e.addedAt,
      }));
    return { items };
  },

  async ids(userId) {
    const wishlist = await Wishlist.findOne({ user: userId }).select('items.product').lean();
    const ids = (wishlist?.items ?? []).map((i) => i.product);
    if (!ids.length) return [];
    const published = await Product.find({ _id: { $in: ids }, isPublished: true }).select('_id').lean();
    return published.map((p) => String(p._id));
  },

  async add(userId, { productId, variantId }) {
    await loadPublished(productId);
    if (variantId && !(await ProductVariant.exists({ _id: variantId, product: productId }))) {
      throw AppError.badRequest('Variant does not belong to this product');
    }
    await ensureWishlist(userId);
    const current = await Wishlist.findOne({ user: userId }).select('items.product').lean();
    const exists = current.items.some((i) => String(i.product) === String(productId));
    if (exists) {
      if (variantId) {
        await Wishlist.updateOne({ user: userId, 'items.product': productId }, { $set: { 'items.$.variant': variantId } });
      }
    } else {
      if (current.items.length >= MAX_ITEMS) throw AppError.conflict(`Your wishlist can hold at most ${MAX_ITEMS} items`);
      await pushItem(userId, productId, variantId ?? null);
    }
    return this.get(userId);
  },

  async remove(userId, productId) {
    await Wishlist.updateOne({ user: userId }, { $pull: { items: { product: productId } } });
    return this.get(userId);
  },

  async moveToCart(userId, productId, { variantId } = {}) {
    await loadPublished(productId);
    const saved = await Wishlist.findOne({ user: userId, 'items.product': productId }, { 'items.$': 1 }).lean();
    if (variantId && !(await ProductVariant.exists({ _id: variantId, product: productId, isActive: true }))) {
      throw AppError.notFound('Selected option is not available');
    }
    const chosen = await resolveVariant(productId, variantId ?? saved?.items?.[0]?.variant ?? null);
    const cart = await cartService.addItem(userId, { variantId: chosen, quantity: 1 });
    await Wishlist.updateOne({ user: userId }, { $pull: { items: { product: productId } } });
    return { wishlist: await this.get(userId), cart };
  },

  async merge(userId, productIds) {
    const unique = [...new Set(productIds.map(String))];
    if (unique.length) {
      await ensureWishlist(userId);
      const published = await Product.find({ _id: { $in: unique }, isPublished: true }).select('_id').lean();
      for (const p of published) await pushItem(userId, p._id);
    }
    return this.get(userId);
  },
};
