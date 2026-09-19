import { Router } from 'express';
import * as customers from '../../controllers/admin/customer.controller.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../validators/common.validator.js';
import { listCustomersQuery, updateCustomerStatusSchema } from '../../validators/customer.validator.js';

const router = Router();

router.get('/', validate({ query: listCustomersQuery }), customers.listCustomers);
router.get('/:id', validate({ params: idParam }), customers.getCustomer);
router.patch('/:id/status', validate({ params: idParam, body: updateCustomerStatusSchema }), customers.updateCustomerStatus);

export default router;
