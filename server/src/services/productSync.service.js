import mongoose from 'mongoose';
import { Inventory, Product, ProductVariant } from '../models/index.js';

const toIdArray = (ids) =>
  (Array.isArray(ids) ? ids : [ids])
    .filter(Boolean)
    .map((id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id))));

export const computeDiscount = (price, compareAtPrice) =>
  compareAtPrice > price && compareAtPrice > 0 ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

/**
 * Recomputes the denormalised catalogue fields of one or many products from their
 * variants and Inventory (the stock source of truth):
 *   - ProductVariant.stock        = Inventory.available
 *   - Product.price               = lowest active variant price
 *   - Product.compareAtPrice      = compareAtPrice of that cheapest variant
 *   - Product.discount            = % off compareAtPrice
 *   - Product.stock               = sum of Inventory.available of active variants
 *   - Product.options.sizes/colors from active variants (position order)
 *
 * Safe to call inside or outside a transaction.
 * @param {import('mongoose').Types.ObjectId | string | Array<import('mongoose').Types.ObjectId | string>} productIds
 * @param {import('mongoose').ClientSession | null} [session]
 */
export async function syncProductAggregates(productIds, session = null) {
  const ids = [...new Map(toIdArray(productIds).map((id) => [String(id), id])).values()];
  if (!ids.length) return;
  const opts = session ? { session } : {};

  // Sequential on purpose: operations sharing a transaction session must not run in parallel.
  const variants = await ProductVariant.find({ product: { $in: ids } })
    .select('product price compareAtPrice size color colorHex stock isActive position createdAt')
    .sort({ position: 1, createdAt: 1 })
    .session(session)
    .lean();
  const inventories = await Inventory.find({ product: { $in: ids } }).select('variant available').session(session).lean();

  const availableByVariant = new Map(inventories.map((i) => [String(i.variant), i.available]));

  // 1. Variant stock mirrors Inventory.available
  const variantOps = [];
  for (const v of variants) {
    const available = availableByVariant.get(String(v._id)) ?? 0;
    if (v.stock !== available) {
      variantOps.push({ updateOne: { filter: { _id: v._id }, update: { $set: { stock: available } } } });
      v.stock = available;
    }
  }
  if (variantOps.length) await ProductVariant.bulkWrite(variantOps, opts);

  // 2. Product aggregates
  const byProduct = new Map(ids.map((id) => [String(id), []]));
  for (const v of variants) byProduct.get(String(v.product))?.push(v);

  const productOps = [];
  for (const [productId, list] of byProduct) {
    const active = list.filter((v) => v.isActive);
    if (!active.length) {
      productOps.push({
        updateOne: {
          filter: { _id: productId },
          update: { $set: { stock: 0, 'options.sizes': [], 'options.colors': [] } },
        },
      });
      continue;
    }
    const cheapest = active.reduce((min, v) => (v.price < min.price ? v : min), active[0]);
    const sizes = [...new Set(active.map((v) => v.size).filter(Boolean))];
    const colorMap = new Map();
    for (const v of active) {
      if (v.color && !colorMap.has(v.color.toLowerCase())) colorMap.set(v.color.toLowerCase(), { name: v.color, hex: v.colorHex || '' });
    }
    const price = cheapest.price;
    const compareAtPrice = cheapest.compareAtPrice || 0;
    productOps.push({
      updateOne: {
        filter: { _id: productId },
        update: {
          $set: {
            price,
            compareAtPrice,
            discount: computeDiscount(price, compareAtPrice),
            stock: active.reduce((sum, v) => sum + (v.stock || 0), 0),
            'options.sizes': sizes,
            'options.colors': [...colorMap.values()],
          },
        },
      },
    });
  }
  if (productOps.length) await Product.bulkWrite(productOps, opts);
}
