import { Router } from 'express';
import * as orders from '../../controllers/admin/order.controller.js';
import { validate } from '../../middleware/validate.js';
import {
  adminCancelSchema,
  adminNoteSchema,
  listAdminOrdersQuery,
  paymentStatusSchema,
  refundSchema,
  resolveReturnSchema,
  updateStatusSchema,
  updateTrackingSchema,
} from '../../validators/adminOrder.validator.js';
import { idParam } from '../../validators/common.validator.js';

const router = Router();

router.get('/', validate({ query: listAdminOrdersQuery }), orders.listOrders);
router.get('/:id', validate({ params: idParam }), orders.getOrder);
router.patch('/:id/status', validate({ params: idParam, body: updateStatusSchema }), orders.updateStatus);
router.patch('/:id/tracking', validate({ params: idParam, body: updateTrackingSchema }), orders.updateTracking);
router.post('/:id/cancel', validate({ params: idParam, body: adminCancelSchema }), orders.cancelOrder);
router.patch('/:id/return', validate({ params: idParam, body: resolveReturnSchema }), orders.resolveReturn);
router.post('/:id/refund', validate({ params: idParam, body: refundSchema }), orders.refundOrder);
router.patch('/:id/payment-status', validate({ params: idParam, body: paymentStatusSchema }), orders.markPaid);
router.patch('/:id/note', validate({ params: idParam, body: adminNoteSchema }), orders.updateNote);

export default router;
