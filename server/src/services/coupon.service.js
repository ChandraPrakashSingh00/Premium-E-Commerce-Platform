import { COUPON_TYPE } from '../constants/index.js';
import { Coupon, CouponUsage } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, isDuplicateKeyError, roundMoney } from '../utils/helpers.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

const PUBLIC_FIELDS = 'code description discountType discountValue minOrderAmount maxDiscount expiresAt';

const normalizeCode = (code) => String(code ?? '').trim().toUpperCase();
const hasCapacity = { $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] };
const opts = (session) => (session ? { session } : {});

/** Discount a coupon gives on the given (eligible) subtotal. Never exceeds the subtotal. */
export function computeCouponDiscount(coupon, subtotal) {
  let amount =
    coupon.discountType === COUPON_TYPE.PERCENTAGE ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  if (coupon.discountType === COUPON_TYPE.PERCENTAGE && coupon.maxDiscount > 0) amount = Math.min(amount, coupon.maxDiscount);
  return roundMoney(Math.max(0, Math.min(amount, subtotal)));
}

const withExpiry = (c) => ({ ...c, isExpired: new Date(c.expiresAt) < new Date() });

export const couponService = {
  computeCouponDiscount,

  /**
   * Validates a coupon for a (possibly anonymous) shopper.
   * @returns {Promise<{coupon: object, discountAmount: number}>}
   * @throws AppError 422 with a customer-facing message
   */
  async validateForUser(code, { userId, subtotal }) {
    const normalized = normalizeCode(code);
    const coupon = normalized ? await Coupon.findOne({ code: normalized }).lean() : null;
    const now = new Date();
    if (!coupon || !coupon.isActive) throw AppError.unprocessable('This coupon code is invalid or no longer active');
    if (coupon.startsAt && coupon.startsAt > now) throw AppError.unprocessable('This coupon is not active yet');
    if (coupon.expiresAt <= now) throw AppError.unprocessable('This coupon has expired');
    if (subtotal < coupon.minOrderAmount) {
      throw AppError.unprocessable(
        `A minimum order of ₹${coupon.minOrderAmount} is required to use this coupon (add ₹${roundMoney(coupon.minOrderAmount - subtotal)} more)`,
      );
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw AppError.unprocessable('This coupon has reached its usage limit');
    }
    if (userId) {
      const used = await CouponUsage.countDocuments({ coupon: coupon._id, user: userId });
      if (used >= coupon.perUserLimit) {
        throw AppError.unprocessable(
          coupon.perUserLimit === 1 ? 'You have already used this coupon' : 'You have reached the usage limit for this coupon',
        );
      }
    }
    return { coupon, discountAmount: computeCouponDiscount(coupon, subtotal) };
  },

  /**
   * Atomically consumes one global use and one per-user slot for an order.
   * Idempotent per order. Race-safe through the conditional $inc and the unique
   * (coupon, user, slot) index.
   */
  async redeem(couponId, { userId, orderId, discountAmount, session = null }) {
    const existing = await CouponUsage.findOne({ order: orderId }).session(session).lean();
    if (existing) return existing;

    const inc = await Coupon.updateOne({ _id: couponId, isActive: true, ...hasCapacity }, { $inc: { usedCount: 1 } }, opts(session));
    if (inc.modifiedCount === 0) throw AppError.unprocessable('This coupon has reached its usage limit');

    const coupon = await Coupon.findById(couponId).select('perUserLimit').session(session).lean();
    const limit = coupon?.perUserLimit ?? 1;
    const base = { coupon: couponId, user: userId, order: orderId, discountAmount: roundMoney(discountAmount) };
    const limitError = () =>
      AppError.unprocessable(limit === 1 ? 'You have already used this coupon' : 'You have reached the usage limit for this coupon');

    if (session) {
      // Inside a transaction a duplicate-key error aborts the transaction, so pick
      // the first free slot up front. Concurrent inserts of the same slot surface as
      // transient write conflicts (retried) or a duplicate key (mapped below).
      const taken = await CouponUsage.find({ coupon: couponId, user: userId }).select('slot').session(session).lean();
      const used = new Set(taken.map((t) => t.slot));
      let slot = 0;
      for (let s = 1; s <= limit; s += 1) {
        if (!used.has(s)) {
          slot = s;
          break;
        }
      }
      if (!slot) throw limitError();
      try {
        const [usage] = await CouponUsage.create([{ ...base, slot }], { session });
        return usage.toObject();
      } catch (err) {
        if (isDuplicateKeyError(err) && err.keyPattern?.slot) throw limitError();
        throw err;
      }
    }

    for (let slot = 1; slot <= limit; slot += 1) {
      try {
        const usage = await CouponUsage.create({ ...base, slot });
        return usage.toObject();
      } catch (err) {
        if (!isDuplicateKeyError(err)) {
          await Coupon.updateOne({ _id: couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
          throw err;
        }
        if (!err.keyPattern?.slot) {
          // Same order redeemed concurrently: undo our extra increment.
          await Coupon.updateOne({ _id: couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
          return CouponUsage.findOne({ order: orderId }).lean();
        }
      }
    }
    await Coupon.updateOne({ _id: couponId, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } });
    throw limitError();
  },

  /** Gives back the usage consumed by an order (cancellation). Idempotent. */
  async release(orderId, session = null) {
    const usage = await CouponUsage.findOneAndDelete({ order: orderId }, opts(session)).lean();
    if (!usage) return false;
    await Coupon.updateOne({ _id: usage.coupon, usedCount: { $gt: 0 } }, { $inc: { usedCount: -1 } }, opts(session));
    return true;
  },

  async listAvailable() {
    const now = new Date();
    return Coupon.find({ isActive: true, startsAt: { $lte: now }, expiresAt: { $gt: now }, ...hasCapacity })
      .select(`${PUBLIC_FIELDS} -_id`)
      .sort({ expiresAt: 1 })
      .limit(50)
      .lean();
  },

  // ---------------------------------------------------------------- admin

  async adminList({ page, limit, q, status }) {
    const now = new Date();
    const filter = {};
    if (q) filter.code = { $regex: escapeRegex(q.toUpperCase()) };
    if (status === 'active') Object.assign(filter, { isActive: true, startsAt: { $lte: now }, expiresAt: { $gt: now } });
    if (status === 'inactive') filter.isActive = false;
    if (status === 'expired') filter.expiresAt = { $lte: now };
    if (status === 'scheduled') Object.assign(filter, { startsAt: { $gt: now }, expiresAt: { $gt: now } });
    const p = getPagination({ page, limit });
    const [items, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).lean(),
      Coupon.countDocuments(filter),
    ]);
    return { items: items.map(withExpiry), pagination: buildPagination({ ...p, total }) };
  },

  async adminGet(id) {
    const coupon = await Coupon.findById(id).lean();
    if (!coupon) throw AppError.notFound('Coupon not found');
    const usages = await CouponUsage.find({ coupon: id })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('user', 'name email')
      .populate('order', 'orderNumber')
      .lean();
    return {
      coupon: withExpiry(coupon),
      usages: usages.map((u) => ({
        _id: u._id,
        user: u.user ? { _id: u.user._id, name: u.user.name, email: u.user.email } : null,
        order: u.order ? { _id: u.order._id, orderNumber: u.order.orderNumber } : null,
        discountAmount: u.discountAmount,
        createdAt: u.createdAt,
      })),
    };
  },

  async create(data, userId) {
    try {
      const coupon = await Coupon.create({ ...data, createdBy: userId });
      return withExpiry(coupon.toObject());
    } catch (err) {
      if (isDuplicateKeyError(err)) throw AppError.conflict('A coupon with this code already exists');
      throw err;
    }
  },

  async update(id, changes) {
    const coupon = await Coupon.findById(id);
    if (!coupon) throw AppError.notFound('Coupon not found');
    coupon.set(changes);
    try {
      await coupon.save();
    } catch (err) {
      if (isDuplicateKeyError(err)) throw AppError.conflict('A coupon with this code already exists');
      throw err;
    }
    return withExpiry(coupon.toObject());
  },

  async setStatus(id, isActive) {
    const coupon = await Coupon.findByIdAndUpdate(id, { $set: { isActive } }, { returnDocument: 'after' }).lean();
    if (!coupon) throw AppError.notFound('Coupon not found');
    return withExpiry(coupon);
  },

  async remove(id) {
    const coupon = await Coupon.findById(id).lean();
    if (!coupon) throw AppError.notFound('Coupon not found');
    if (coupon.usedCount > 0 || (await CouponUsage.exists({ coupon: id }))) {
      throw AppError.conflict('This coupon has already been used; deactivate it instead');
    }
    await Coupon.deleteOne({ _id: id });
  },
};
