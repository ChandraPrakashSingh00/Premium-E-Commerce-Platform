import { INVENTORY_TXN } from '../constants/index.js';
import { Inventory, InventoryTransaction, Order, ProductVariant } from '../models/index.js';
import { AppError } from '../utils/AppError.js';

const EDITABLE = ['sku', 'size', 'color', 'colorHex', 'price', 'compareAtPrice', 'images', 'isActive', 'isDefault'];

const comboKey = (v) => `${(v.size ?? '').toLowerCase()}|${(v.color ?? '').toLowerCase()}`;

/** Builds a new variant document (without stock) from input. */
const newVariantDoc = (productId, input, position) => ({
  product: productId,
  sku: input.sku,
  size: input.size || undefined,
  color: input.color || undefined,
  colorHex: input.colorHex || undefined,
  price: input.price,
  compareAtPrice: input.compareAtPrice ?? 0,
  images: input.images ?? [],
  isActive: input.isActive ?? true,
  isDefault: Boolean(input.isDefault),
  position,
});

/**
 * Creates variants plus their Inventory documents (and an "Initial stock" ADJUSTMENT
 * transaction when stock > 0). Must be called inside a transaction when available.
 * @param {Array<{input: object, position: number}>} entries
 */
export async function createVariantsWithInventory(productId, entries, { session, lowStockThreshold, userId }) {
  if (!entries.length) return [];
  const variants = await ProductVariant.create(
    entries.map(({ input, position }) => newVariantDoc(productId, input, position)),
    { session, ordered: true },
  );
  const inventories = await Inventory.create(
    variants.map((v, i) => ({
      variant: v._id,
      product: productId,
      sku: v.sku,
      available: entries[i].input.stock ?? 0,
      lowStockThreshold,
    })),
    { session, ordered: true },
  );
  const txns = inventories
    .filter((inv) => inv.available > 0)
    .map((inv) => ({
      inventory: inv._id,
      product: productId,
      variant: inv.variant,
      sku: inv.sku,
      type: INVENTORY_TXN.ADJUSTMENT,
      quantity: inv.available,
      availableAfter: inv.available,
      reservedAfter: 0,
      soldAfter: 0,
      reason: 'Initial stock',
      performedBy: userId,
    }));
  if (txns.length) await InventoryTransaction.create(txns, { session, ordered: true });
  return variants;
}

/** Makes sure exactly one active variant is flagged as default. */
export async function ensureSingleDefault(productId, session) {
  const active = await ProductVariant.find({ product: productId, isActive: true })
    .select('_id isDefault')
    .sort({ isDefault: -1, position: 1, createdAt: 1 })
    .session(session)
    .lean();
  const defaultId = active[0]?._id;
  await ProductVariant.updateMany(
    { product: productId, _id: { $ne: defaultId ?? null }, isDefault: true },
    { $set: { isDefault: false } },
    { session },
  );
  if (defaultId && !active[0].isDefault) {
    await ProductVariant.updateOne({ _id: defaultId }, { $set: { isDefault: true } }, { session });
  }
}

/**
 * Reconciles a product's variants with the submitted list:
 *  - entries with `_id` update the existing variant (stock is never changed here),
 *  - entries without `_id` are created with inventory — unless they match a removed
 *    variant's size/colour, in which case that variant is reused and reactivated,
 *  - existing variants missing from the list are deactivated when they have order
 *    history, otherwise deleted together with their inventory.
 */
export async function syncVariants(productId, inputs, { session, lowStockThreshold, userId }) {
  const existing = await ProductVariant.find({ product: productId }).session(session);
  const byId = new Map(existing.map((v) => [String(v._id), v]));

  for (const input of inputs) {
    if (input._id && !byId.has(String(input._id))) {
      throw AppError.badRequest(`Variant ${input._id} does not belong to this product`);
    }
  }

  const keptIds = new Set(inputs.filter((i) => i._id).map((i) => String(i._id)));
  const removed = existing.filter((v) => !keptIds.has(String(v._id)));

  // New entries matching a removed variant (same size/colour) reuse it: avoids unique-index clashes.
  const removedByCombo = new Map(removed.map((v) => [comboKey(v), v]));
  const resolved = inputs.map((input) => {
    if (input._id) return { input, doc: byId.get(String(input._id)) };
    const reuse = removedByCombo.get(comboKey(input));
    if (reuse) {
      removedByCombo.delete(comboKey(input));
      return { input: { ...input, isActive: input.isActive ?? true }, doc: reuse };
    }
    return { input, doc: null };
  });
  const reusedIds = new Set(resolved.filter((r) => r.doc && !r.input._id).map((r) => String(r.doc._id)));
  const toRemove = removed.filter((v) => !reusedIds.has(String(v._id)));

  if (toRemove.length) {
    const removeIds = toRemove.map((v) => v._id);
    const withHistory = new Set(
      (await Order.distinct('items.variant', { 'items.variant': { $in: removeIds } }).session(session)).map(String),
    );
    const deactivate = removeIds.filter((id) => withHistory.has(String(id)));
    const hardDelete = removeIds.filter((id) => !withHistory.has(String(id)));
    if (deactivate.length) {
      await ProductVariant.updateMany({ _id: { $in: deactivate } }, { $set: { isActive: false, isDefault: false } }, { session });
    }
    if (hardDelete.length) {
      // Sequential: operations sharing a transaction session must not run in parallel.
      await ProductVariant.deleteMany({ _id: { $in: hardDelete } }, { session });
      await Inventory.deleteMany({ variant: { $in: hardDelete } }, { session });
      await InventoryTransaction.deleteMany({ variant: { $in: hardDelete } }, { session });
    }
  }

  // Updates (sequential to keep unique-index checks deterministic).
  for (const [position, { input, doc }] of resolved.entries()) {
    if (!doc) continue;
    for (const key of EDITABLE) {
      if (input[key] !== undefined) doc[key] = input[key] === '' ? undefined : input[key];
    }
    doc.position = position;
    if (input.size !== undefined || input.color !== undefined) doc.title = undefined; // rebuilt on validate
    await doc.save({ session });
  }

  const creates = resolved.map(({ input, doc }, position) => ({ input, doc, position })).filter((r) => !r.doc);
  await createVariantsWithInventory(productId, creates, { session, lowStockThreshold, userId });

  if (!(await ProductVariant.exists({ product: productId, isActive: true }).session(session))) {
    throw AppError.badRequest('A product needs at least one active variant');
  }
  await ensureSingleDefault(productId, session);
}
