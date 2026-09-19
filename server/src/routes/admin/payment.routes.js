import { Router } from 'express';
import * as payments from '../../controllers/admin/payment.controller.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../validators/common.validator.js';
import { listPaymentsQuery } from '../../validators/payment.validator.js';

const router = Router();

router.get('/', validate({ query: listPaymentsQuery }), payments.listPayments);
router.get('/:id', validate({ params: idParam }), payments.getPayment);

export default router;
