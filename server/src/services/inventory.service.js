import mongoose from 'mongoose';
import { logger } from '../config/logger.js';
import { INVENTORY_TXN } from '../constants/index.js';
import { Inventory, InventoryTransaction, Product } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, isDuplicateKeyError } from '../utils/helpers.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { syncProductAggregates } from './productSync.service.js';

/**
 * Stock movements linked to an order. Each op is guarded by a condition so stock
 * can never go negative, and recorded once per (order, variant, type) thanks to
 * the unique index on InventoryTransaction.
 */
const OPS = {
  [INVENTORY_TXN.RESERVE]: {
    guard: (q) => ({ available: { $gte: q } }),
    inc: (q) => ({ available: -q, reserved: q }),
    signed: (q) => -q,
    error: (sku) => AppError.conflict(`Insufficient stock for ${sku}`),
  },
  [INVENTORY_TXN.RELEASE]: {
    guard: (q) => ({ reserved: { $gte: q } }),
    inc: (q) => ({ available: q, reserved: -q }),
    signed: (q) => q,
  },
  /** Reserved -> sold. */
  [INVENTORY_TXN.SALE]: {
    guard: (q) => ({ reserved: { $gte: q } }),
    inc: (q) => ({ reserved: -q, sold: q }),
    signed: (q) => -q,
    soldDelta: (q) => q,
  },
  [INVENTORY_TXN.RETURN]: {
    guard: (q) => ({ sold: { $gte: q } }),
    inc: (q) => ({ sold: -q, available: q }),
    signed: (q) => q,
    soldDelta: (q) => -q,
  },
};

/** Available -> sold directly (payment captured after the reservation was released). */
const DIRECT_SALE = {
  guard: (q) => ({ available: { $gte: q } }),
  inc: (q) => ({ available: -q, sold: q }),
  signed: (q) => -q,
  soldDelta: (q) => q,
  error: (sku) => AppError.conflict(`Insufficient stock for ${sku}`),
};

const negate = (inc) => Object.fromEntries(Object.entries(inc).map(([k, v]) => [k, -v]));
const opts = (session) => (session ? { session } : {});

/** Merges duplicate variants and drops non-positive quantities. */
function normalizeItems(items) {
  const map = new Map();
  for (const it of items) {
    const variantId = it.variantId ?? it.variant;
    const qty = Number(it.quantity) || 0;
    if (!variantId || qty <= 0) continue;
    const key = String(variantId);
    map.set(key, { variantId, quantity: (map.get(key)?.quantity ?? 0) + qty });
  }
  return [...map.values()];
}

function warnIfLow(inv) {
  if (inv && inv.available <= inv.lowStockThreshold) {
    logger.warn({ sku: inv.sku, available: inv.available, threshold: inv.lowStockThreshold }, 'Low stock');
  }
}

async function applyOrderOp(type, rawItems, { orderId, session = null, op = OPS[type] }) {
  const items = normalizeItems(rawItems);
  if (!items.length) return [];
  const variantIds = items.map((i) => i.variantId);

  // Sequential on purpose: parallel operations on one session are not allowed in transactions.
  const existing = await InventoryTransaction.find({ order: orderId, type, variant: { $in: variantIds } })
    .select('variant')
    .session(session)
    .lean();
  const inventories = await Inventory.find({ variant: { $in: variantIds } }).session(session).lean();
  const done = new Set(existing.map((t) => String(t.variant)));
  const invMap = new Map(inventories.map((i) => [String(i.variant), i]));

  const applied = [];
  const compensate = async () => {
    if (session) return; // the transaction rolls everything back
    for (const a of applied.reverse()) {
      try {
        await Inventory.updateOne({ _id: a.inventory._id }, { $inc: negate(op.inc(a.quantity)) });
        await InventoryTransaction.deleteOne({ _id: a.txnId });
        if (op.soldDelta) await Product.updateOne({ _id: a.inventory.product }, { $inc: { soldCount: -op.soldDelta(a.quantity) } });
      } catch (err) {
        logger.error({ err, orderId, sku: a.inventory.sku }, 'Inventory compensation failed');
      }
    }
  };

  try {
    for (const { variantId, quantity } of items) {
      if (done.has(String(variantId))) continue;
      const inv = invMap.get(String(variantId));
      if (!inv) throw AppError.conflict('An item in your order is no longer available');

      let txn;
      try {
        [txn] = await InventoryTransaction.create(
          [{ inventory: inv._id, product: inv.product, variant: variantId, sku: inv.sku, type, quantity: op.signed(quantity), order: orderId }],
          opts(session),
        );
      } catch (err) {
        // Already applied by a concurrent call: skip (outside transactions only –
        // inside one the error aborts the transaction and is rethrown).
        if (!session && isDuplicateKeyError(err)) continue;
        throw err;
      }

      const updated = await Inventory.findOneAndUpdate(
        { _id: inv._id, ...op.guard(quantity) },
        { $inc: op.inc(quantity) },
        { returnDocument: 'after', ...opts(session) },
      ).lean();
      if (!updated) {
        if (!session) await InventoryTransaction.deleteOne({ _id: txn._id });
        throw op.error ? op.error(inv.sku) : AppError.conflict(`Inventory state mismatch for ${inv.sku}`);
      }
      applied.push({ inventory: inv, quantity, txnId: txn._id });

      await InventoryTransaction.updateOne(
        { _id: txn._id },
        { $set: { availableAfter: updated.available, reservedAfter: updated.reserved, soldAfter: updated.sold } },
        opts(session),
      );
      if (op.soldDelta) {
        const delta = op.soldDelta(quantity);
        const filter = { _id: inv.product, ...(delta < 0 && { soldCount: { $gte: -delta } }) };
        await Product.updateOne(filter, { $inc: { soldCount: delta } }, opts(session));
      }
      if (type === INVENTORY_TXN.RESERVE || op === DIRECT_SALE) warnIfLow(updated);
    }
  } catch (err) {
    await compensate();
    throw err;
  }

  if (applied.length) {
    await syncProductAggregates(
      applied.map((a) => a.inventory.product),
      session,
    );
  }
  return applied;
}

const STATUS_MATCH = {
  in: { $expr: { $gt: ['$available', '$lowStockThreshold'] } },
  low: { available: { $gt: 0 }, $expr: { $lte: ['$available', '$lowStockThreshold'] } },
  out: { available: { $lte: 0 } },
};

export const inventoryService = {
  normalizeItems,

  reserve: (items, ctx) => applyOrderOp(INVENTORY_TXN.RESERVE, items, ctx),
  release: (items, ctx) => applyOrderOp(INVENTORY_TXN.RELEASE, items, ctx),
  commit: (items, ctx) => applyOrderOp(INVENTORY_TXN.SALE, items, ctx),
  returnStock: (items, ctx) => applyOrderOp(INVENTORY_TXN.RETURN, items, ctx),
  /** Sells straight from available stock (late payment for a released order). */
  sellDirect: (items, ctx) => applyOrderOp(INVENTORY_TXN.SALE, items, { ...ctx, op: DIRECT_SALE }),

  /** Audited manual stock adjustment by an admin. */
  async adjust(inventoryId, { mode, quantity, reason, lowStockThreshold }, { userId }) {
    let updated;
    let delta = 0;
    for (let attempt = 0; attempt < 5 && !updated; attempt += 1) {
      const current = await Inventory.findById(inventoryId).lean();
      if (!current) throw AppError.notFound('Inventory record not found');
      const set = lowStockThreshold !== undefined ? { lowStockThreshold } : {};
      let filter = { _id: inventoryId };
      let update;
      if (mode === 'set') {
        delta = quantity - current.available;
        filter = { _id: inventoryId, available: current.available }; // optimistic
        update = { $set: { ...set, available: quantity } };
      } else if (mode === 'increment') {
        delta = quantity;
        update = { $inc: { available: quantity }, ...(Object.keys(set).length && { $set: set }) };
      } else {
        if (current.available < quantity) throw AppError.conflict(`Only ${current.available} units available to remove`);
        delta = -quantity;
        filter = { _id: inventoryId, available: { $gte: quantity } };
        update = { $inc: { available: -quantity }, ...(Object.keys(set).length && { $set: set }) };
      }
      updated = await Inventory.findOneAndUpdate(filter, update, { returnDocument: 'after' }).lean();
    }
    if (!updated) throw AppError.conflict('Stock changed while updating, please retry');

    await InventoryTransaction.create({
      inventory: updated._id,
      product: updated.product,
      variant: updated.variant,
      sku: updated.sku,
      type: INVENTORY_TXN.ADJUSTMENT,
      quantity: delta,
      availableAfter: updated.available,
      reservedAfter: updated.reserved,
      soldAfter: updated.sold,
      reason,
      performedBy: userId,
    });
    await syncProductAggregates(updated.product);
    warnIfLow(updated);
    return { ...updated, isLowStock: updated.available <= updated.lowStockThreshold };
  },

  async list({ page, limit, q, status }) {
    const p = getPagination({ page, limit });
    const match = { ...(status && STATUS_MATCH[status]) };
    if (q) {
      const rx = { $regex: escapeRegex(q), $options: 'i' };
      match.$or = [{ sku: rx }, { 'product.name': rx }];
    }
    const [result] = await Inventory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'product',
          pipeline: [{ $project: { name: 1, slug: 1, thumbnail: 1 } }],
        },
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'productvariants',
          localField: 'variant',
          foreignField: '_id',
          as: 'variant',
          pipeline: [{ $project: { title: 1, size: 1, color: 1 } }],
        },
      },
      { $unwind: { path: '$variant', preserveNullAndEmptyArrays: true } },
      { $match: match },
      {
        $facet: {
          items: [
            { $sort: { available: 1, _id: 1 } },
            { $skip: p.skip },
            { $limit: p.limit },
            {
              $project: {
                sku: 1,
                available: 1,
                reserved: 1,
                sold: 1,
                lowStockThreshold: 1,
                product: 1,
                variant: 1,
                updatedAt: 1,
                isLowStock: { $lte: ['$available', '$lowStockThreshold'] },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);
    const [totalSkus, lowStock, outOfStock] = await Promise.all([
      Inventory.countDocuments(),
      Inventory.countDocuments(STATUS_MATCH.low),
      Inventory.countDocuments(STATUS_MATCH.out),
    ]);
    const total = result?.total[0]?.count ?? 0;
    return {
      items: result?.items ?? [],
      pagination: buildPagination({ ...p, total }),
      meta: { totalSkus, lowStock, outOfStock },
    };
  },

  async transactions({ page, limit, type, inventoryId, productId }) {
    const p = getPagination({ page, limit });
    const filter = {
      ...(type && { type }),
      ...(inventoryId && { inventory: new mongoose.Types.ObjectId(inventoryId) }),
      ...(productId && { product: new mongoose.Types.ObjectId(productId) }),
    };
    const [items, total] = await Promise.all([
      InventoryTransaction.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(p.skip)
        .limit(p.limit)
        .populate('order', 'orderNumber')
        .populate('performedBy', 'name')
        .lean(),
      InventoryTransaction.countDocuments(filter),
    ]);
    return {
      items: items.map((t) => ({
        _id: t._id,
        type: t.type,
        quantity: t.quantity,
        sku: t.sku,
        inventory: t.inventory,
        product: t.product,
        availableAfter: t.availableAfter,
        reservedAfter: t.reservedAfter,
        soldAfter: t.soldAfter,
        reason: t.reason,
        order: t.order ? { _id: t.order._id, orderNumber: t.order.orderNumber } : null,
        performedBy: t.performedBy ? { _id: t.performedBy._id, name: t.performedBy.name } : null,
        createdAt: t.createdAt,
      })),
      pagination: buildPagination({ ...p, total }),
    };
  },
};
