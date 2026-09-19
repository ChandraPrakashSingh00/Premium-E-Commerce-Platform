import { Router } from 'express';
import {
  createReview,
  deleteReview,
  getEligibility,
  listProductReviews,
  toggleHelpful,
  updateReview,
  uploadReviewImages,
} from '../controllers/review.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { uploadImages } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.validator.js';
import {
  createReviewSchema,
  productIdParam,
  productReviewsQuery,
  updateReviewSchema,
} from '../validators/review.validator.js';

const router = Router();

router.get('/product/:productId', optionalAuth, validate({ params: productIdParam, query: productReviewsQuery }), listProductReviews);
router.get('/eligibility/:productId', authenticate, validate({ params: productIdParam }), getEligibility);
router.post('/images', authenticate, uploadImages, uploadReviewImages);
router.post('/', authenticate, validate({ body: createReviewSchema }), createReview);
router.patch('/:id', authenticate, validate({ params: idParam, body: updateReviewSchema }), updateReview);
router.delete('/:id', authenticate, validate({ params: idParam }), deleteReview);
router.post('/:id/helpful', authenticate, validate({ params: idParam }), toggleHelpful);

export default router;
