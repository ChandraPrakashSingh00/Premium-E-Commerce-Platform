import { reviewService } from '../services/review.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/apiResponse.js';

export const listProductReviews = asyncHandler(async (req, res) => {
  sendPaginated(res, await reviewService.listForProduct(req.params.productId, req.validatedQuery, req.user?._id));
});

export const getEligibility = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await reviewService.eligibility(req.user._id, req.params.productId) });
});

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.create(req.user._id, req.body);
  sendCreated(res, review, review.status === 'approved' ? 'Thanks for your review!' : 'Thanks! Your review will appear once approved.');
});

export const updateReview = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await reviewService.update(req.params.id, req.user._id, req.body), message: 'Review updated' });
});

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.remove(req.params.id, req.user._id);
  sendSuccess(res, { message: 'Review deleted' });
});

export const toggleHelpful = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await reviewService.toggleHelpful(req.params.id, req.user._id) });
});

export const uploadReviewImages = asyncHandler(async (req, res) => {
  sendCreated(res, await reviewService.uploadImages(req.files), 'Images uploaded');
});
