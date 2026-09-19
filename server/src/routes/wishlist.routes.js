import { Router } from 'express';
import * as wishlist from '../controllers/wishlist.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addWishlistSchema,
  mergeWishlistSchema,
  moveToCartSchema,
  productIdParam,
} from '../validators/wishlist.validator.js';

const router = Router();

router.use(authenticate);
router.get('/', wishlist.getWishlist);
router.get('/ids', wishlist.getWishlistIds);
router.post('/items', validate({ body: addWishlistSchema }), wishlist.addToWishlist);
router.delete('/items/:productId', validate({ params: productIdParam }), wishlist.removeFromWishlist);
router.post(
  '/items/:productId/move-to-cart',
  validate({ params: productIdParam, body: moveToCartSchema }),
  wishlist.moveToCart,
);
router.post('/merge', validate({ body: mergeWishlistSchema }), wishlist.mergeWishlist);

export default router;
