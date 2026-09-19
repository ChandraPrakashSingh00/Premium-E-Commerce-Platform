import { Router } from 'express';
import { deleteReview, listReviews, moderateReview } from '../../controllers/admin/review.controller.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../validators/common.validator.js';
import { adminReviewsQuery, moderateReviewSchema } from '../../validators/review.validator.js';

const router = Router();

router.get('/', validate({ query: adminReviewsQuery }), listReviews);
router.patch('/:id', validate({ params: idParam, body: moderateReviewSchema }), moderateReview);
router.delete('/:id', validate({ params: idParam }), deleteReview);

export default router;
