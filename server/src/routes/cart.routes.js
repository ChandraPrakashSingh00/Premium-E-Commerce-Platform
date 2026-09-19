import { Router } from 'express';
import * as cart from '../controllers/cart.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  addItemSchema,
  applyCouponSchema,
  itemIdParam,
  mergeCartSchema,
  previewCartSchema,
  updateItemSchema,
} from '../validators/cart.validator.js';

const router = Router();

router.post('/preview', optionalAuth, validate({ body: previewCartSchema }), cart.previewCart);

router.use(authenticate);
router.get('/', cart.getCart);
router.delete('/', cart.clearCart);
router.post('/items', validate({ body: addItemSchema }), cart.addItem);
router.patch('/items/:itemId', validate({ params: itemIdParam, body: updateItemSchema }), cart.updateItem);
router.delete('/items/:itemId', validate({ params: itemIdParam }), cart.removeItem);
router.post('/merge', validate({ body: mergeCartSchema }), cart.mergeCart);
router.post('/coupon', validate({ body: applyCouponSchema }), cart.applyCoupon);
router.delete('/coupon', cart.removeCoupon);

export default router;
