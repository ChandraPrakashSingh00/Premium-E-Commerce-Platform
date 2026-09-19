import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS } from '../constants/index.js';
import { Order, Review, User, Wishlist } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { roundMoney } from '../utils/helpers.js';
import { paginate } from '../utils/pagination.js';

const CLOSED_STATUSES = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED, ORDER_STATUS.REFUNDED];

async function updateUser(userId, update) {
  const user = await User.findByIdAndUpdate(userId, update, { returnDocument: 'after', runValidators: true });
  if (!user) throw AppError.notFound('User not found');
  return user.toJSON();
}

export const userService = {
  /** Empty strings clear optional fields. */
  updateProfile(userId, { name, phone, avatar }) {
    const $set = {};
    const $unset = {};
    if (name !== undefined) $set.name = name;
    for (const [key, value] of Object.entries({ phone, avatar })) {
      if (value === '') $unset[key] = 1;
      else if (value !== undefined) $set[key] = value;
    }
    return updateUser(userId, { $set, ...(Object.keys($unset).length && { $unset }) });
  },

  updatePreferences(userId, prefs) {
    const $set = {};
    for (const [key, value] of Object.entries(prefs)) {
      if (value !== undefined) $set[`preferences.${key}`] = value;
    }
    return updateUser(userId, { $set });
  },

  async stats(userId) {
    const uid = new mongoose.Types.ObjectId(String(userId));
    const [[orders], [wishlist], reviewCount] = await Promise.all([
      Order.aggregate([
        { $match: { user: uid } },
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
            totalSpent: { $sum: { $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUS.PAID] }, '$pricing.total', 0] } },
            activeOrders: { $sum: { $cond: [{ $in: ['$status', CLOSED_STATUSES] }, 0, 1] } },
          },
        },
      ]),
      Wishlist.aggregate([{ $match: { user: uid } }, { $project: { count: { $size: '$items' } } }]),
      Review.countDocuments({ user: uid }),
    ]);

    return {
      orderCount: orders?.orderCount ?? 0,
      totalSpent: roundMoney(orders?.totalSpent ?? 0),
      wishlistCount: wishlist?.count ?? 0,
      reviewCount,
      activeOrders: orders?.activeOrders ?? 0,
    };
  },

  myReviews(userId, { page, limit }) {
    return paginate(Review, { user: userId }, {
      page,
      limit,
      sort: { createdAt: -1, _id: -1 },
      select: '-helpfulBy',
      populate: { path: 'product', select: 'name slug thumbnail' },
    });
  },
};
