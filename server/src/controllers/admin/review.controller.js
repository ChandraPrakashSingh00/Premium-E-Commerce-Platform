import { reviewService } from '../../services/review.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse.js';

export const listReviews = asyncHandler(async (req, res) => {
  sendPaginated(res, await reviewService.adminList(req.validatedQuery));
});

export const moderateReview = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await reviewService.moderate(req.params.id, req.body, req.user._id), message: 'Review updated' });
});

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.adminRemove(req.params.id);
  sendSuccess(res, { message: 'Review deleted' });
});
