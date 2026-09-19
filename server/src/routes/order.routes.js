import { Router } from 'express';
import * as orders from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { checkoutLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { idParam } from '../validators/common.validator.js';
import {
  cancelOrderSchema,
  listOrdersQuery,
  placeOrderSchema,
  quoteSchema,
  requireIdempotencyKey,
  returnOrderSchema,
} from '../validators/order.validator.js';

const router = Router();

router.use(authenticate);
router.post('/quote', validate({ body: quoteSchema }), orders.quote);
router.post('/', checkoutLimiter, requireIdempotencyKey, validate({ body: placeOrderSchema }), orders.placeOrder);
router.get('/', validate({ query: listOrdersQuery }), orders.listOrders);
router.get('/:id', validate({ params: idParam }), orders.getOrder);
router.post('/:id/cancel', validate({ params: idParam, body: cancelOrderSchema }), orders.cancelOrder);
router.post('/:id/return', validate({ params: idParam, body: returnOrderSchema }), orders.requestReturn);
router.post('/:id/pay', checkoutLimiter, validate({ params: idParam }), orders.retryPayment);

export default router;
