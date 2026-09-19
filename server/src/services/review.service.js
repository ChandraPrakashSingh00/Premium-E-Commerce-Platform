import mongoose from 'mongoose';
import { ORDER_STATUS, REVIEW_STATUS } from '../constants/index.js';
import { IMAGE_FOLDERS, cloudinary } from '../integrations/cloudinary.js';
import { Order, Product, Review, User } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex } from '../utils/helpers.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { settingsService } from './settings.service.js';
import { uploadService } from './upload.service.js';

const MAX_REVIEW_IMAGES = 5;

const SORTS = {
  recent: { createdAt: -1, _id: -1 },
  helpful: { helpfulCount: -1, createdAt: -1, _id: -1 },
  'rating-high': { rating: -1, createdAt: -1, _id: -1 },
  'rating-low': { rating: 1, createdAt: -1, _id: -1 },
};

const PUBLIC_FIELDS = 'rating title comment images isVerifiedPurchase helpfulCount adminReply user createdAt';

const oid = (id) => (id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(String(id)));
const emptyBreakdown = () => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
const imagePublicIds = (images = []) => images.map((i) => i.publicId).filter(Boolean);

/**
 * Recomputes Product.ratingAverage (1 decimal), reviewCount and ratingBreakdown
 * from approved reviews.
 */
export async function recalculateProductRating(productId) {
  const groups = await Review.aggregate([
    { $match: { product: oid(productId), status: REVIEW_STATUS.APPROVED } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);
  const breakdown = emptyBreakdown();
  let count = 0;
  let sum = 0;
  for (const g of groups) {
    breakdown[g._id] = g.count;
    count += g.count;
    sum += g._id * g.count;
  }
  const ratingAverage = count ? Math.round((sum / count) * 10) / 10 : 0;
  await Product.updateOne({ _id: productId }, { $set: { ratingAverage, reviewCount: count, ratingBreakdown: breakdown } });
  return { average: ratingAverage, count, breakdown };
}

/** Most recent delivered order of the user that contains the product. */
const findDeliveredOrder = (userId, productId) =>
  Order.findOne({ user: userId, status: ORDER_STATUS.DELIVERED, 'items.product': productId })
    .sort({ createdAt: -1 })
    .select('_id')
    .lean();

const setOrderItemReviewed = (orderId, productId, isReviewed) =>
  orderId
    ? Order.updateOne(
        { _id: orderId },
        { $set: { 'items.$[item].isReviewed': isReviewed } },
        { arrayFilters: [{ 'item.product': oid(productId) }] },
      )
    : null;

async function getOwnReview(id, userId) {
  const review = await Review.findById(id);
  if (!review) throw AppError.notFound('Review not found');
  if (String(review.user) !== String(userId)) throw AppError.forbidden('You can only modify your own reviews');
  return review;
}

export const reviewService = {
  async listForProduct(productId, query, userId) {
    const product = await Product.findById(productId).select('ratingAverage reviewCount ratingBreakdown').lean();
    if (!product) throw AppError.notFound('Product not found');

    const { page, limit, skip } = getPagination(query);
    const filter = { product: product._id, status: REVIEW_STATUS.APPROVED, ...(query.rating && { rating: query.rating }) };
    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .select(PUBLIC_FIELDS)
        .sort(SORTS[query.sort] ?? SORTS.recent)
        .skip(skip)
        .limit(limit)
        .populate({ path: 'user', select: 'name avatar -_id' })
        .lean(),
      Review.countDocuments(filter),
    ]);

    let helpfulIds = new Set();
    if (userId && reviews.length) {
      const marked = await Review.find({ _id: { $in: reviews.map((r) => r._id) }, helpfulBy: userId }).select('_id').lean();
      helpfulIds = new Set(marked.map((r) => String(r._id)));
    }

    const items = reviews.map((r) => ({
      ...r,
      user: r.user ? { name: r.user.name, avatar: r.user.avatar ?? null } : { name: 'Customer', avatar: null },
      isHelpful: helpfulIds.has(String(r._id)),
    }));
    return {
      items,
      pagination: buildPagination({ page, limit, total }),
      meta: {
        summary: {
          average: product.ratingAverage ?? 0,
          count: product.reviewCount ?? 0,
          breakdown: { ...emptyBreakdown(), ...product.ratingBreakdown },
        },
      },
    };
  },

  async eligibility(userId, productId) {
    const [product, existing] = await Promise.all([
      Product.exists({ _id: productId }),
      Review.findOne({ product: productId, user: userId }).select('rating title comment images status createdAt').lean(),
    ]);
    if (!product) throw AppError.notFound('Product not found');
    if (existing) return { canReview: false, reason: 'already_reviewed', existingReview: existing };
    if (!(await findDeliveredOrder(userId, productId))) {
      return { canReview: false, reason: 'not_purchased' };
    }
    return { canReview: true };
  },

  async create(userId, { productId, ...input }) {
    const product = await Product.findOne({ _id: productId }).select('_id').lean();
    if (!product) throw AppError.notFound('Product not found');
    if (await Review.exists({ product: productId, user: userId })) {
      throw AppError.conflict('You have already reviewed this product');
    }
    const order = await findDeliveredOrder(userId, productId);
    if (!order) throw AppError.forbidden('Only customers who have received this product can review it');

    const { requireReviewModeration } = await settingsService.get();
    const status = requireReviewModeration ? REVIEW_STATUS.PENDING : REVIEW_STATUS.APPROVED;
    const review = await Review.create({
      ...input,
      product: productId,
      user: userId,
      order: order._id,
      isVerifiedPurchase: true,
      status,
    });

    await setOrderItemReviewed(order._id, productId, true);
    if (status === REVIEW_STATUS.APPROVED) await recalculateProductRating(productId);
    return review.toJSON();
  },

  async update(id, userId, input) {
    const review = await getOwnReview(id, userId);
    const removedImages =
      input.images !== undefined ? imagePublicIds(review.images).filter((p) => !imagePublicIds(input.images).includes(p)) : [];
    for (const key of ['rating', 'title', 'comment', 'images']) {
      if (input[key] !== undefined) review[key] = input[key];
    }
    const { requireReviewModeration } = await settingsService.get();
    if (requireReviewModeration) review.status = REVIEW_STATUS.PENDING;
    await review.save();
    await recalculateProductRating(review.product);
    removedImages.forEach((p) => cloudinary.destroy(p));
    return review.toJSON();
  },

  async remove(id, userId) {
    const review = await getOwnReview(id, userId);
    await this.deleteReview(review);
  },

  /** Deletes a review (owner or admin) and reverts its side effects. */
  async deleteReview(review) {
    await Review.deleteOne({ _id: review._id });
    await Promise.all([
      recalculateProductRating(review.product),
      setOrderItemReviewed(review.order, review.product, false),
      ...imagePublicIds(review.images).map((p) => cloudinary.destroy(p)),
    ]);
  },

  /** Toggles the "helpful" vote atomically. */
  async toggleHelpful(id, userId) {
    const review = await Review.findById(id).select('user status').lean();
    if (!review || review.status !== REVIEW_STATUS.APPROVED) throw AppError.notFound('Review not found');
    if (String(review.user) === String(userId)) throw AppError.badRequest('You cannot vote on your own review');

    const uid = oid(userId);
    const added = await Review.findOneAndUpdate(
      { _id: id, helpfulBy: { $ne: uid } },
      { $addToSet: { helpfulBy: uid }, $inc: { helpfulCount: 1 } },
      { returnDocument: 'after', projection: { helpfulCount: 1 } },
    ).lean();
    if (added) return { helpfulCount: added.helpfulCount, isHelpful: true };

    const removed = await Review.findOneAndUpdate(
      { _id: id, helpfulBy: uid },
      { $pull: { helpfulBy: uid }, $inc: { helpfulCount: -1 } },
      { returnDocument: 'after', projection: { helpfulCount: 1 } },
    ).lean();
    if (removed) return { helpfulCount: Math.max(0, removed.helpfulCount), isHelpful: false };

    // Lost a race with a concurrent toggle: report the current state.
    const current = await Review.findById(id).select('helpfulCount').lean();
    return { helpfulCount: current?.helpfulCount ?? 0, isHelpful: false };
  },

  uploadImages(files) {
    return uploadService.uploadImages(files, { folder: IMAGE_FOLDERS.reviews, max: MAX_REVIEW_IMAGES });
  },

  // ---------- admin ----------

  async adminList(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.rating) filter.rating = query.rating;
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      const [products, users] = await Promise.all([
        Product.find({ name: regex }).select('_id').limit(100).lean(),
        User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id').limit(100).lean(),
      ]);
      filter.$or = [
        { title: regex },
        { comment: regex },
        { product: { $in: products.map((p) => p._id) } },
        { user: { $in: users.map((u) => u._id) } },
      ];
    }
    const [items, total] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .populate([
          { path: 'product', select: 'name slug thumbnail' },
          { path: 'user', select: 'name email' },
        ])
        .lean(),
      Review.countDocuments(filter),
    ]);
    return { items, pagination: buildPagination({ page, limit, total }) };
  },

  async moderate(id, { status, adminReply }, adminId) {
    const review = await Review.findById(id);
    if (!review) throw AppError.notFound('Review not found');
    if (status !== undefined) review.status = status;
    if (adminReply !== undefined) review.adminReply = adminReply || undefined;
    review.moderatedBy = adminId;
    review.moderatedAt = new Date();
    await review.save();
    await recalculateProductRating(review.product);
    return Review.findById(id)
      .populate([
        { path: 'product', select: 'name slug thumbnail' },
        { path: 'user', select: 'name email' },
      ])
      .lean();
  },

  async adminRemove(id) {
    const review = await Review.findById(id).lean();
    if (!review) throw AppError.notFound('Review not found');
    await this.deleteReview(review);
  },
};
