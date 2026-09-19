import { Router } from 'express';
import * as inventory from '../../controllers/admin/inventory.controller.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../validators/common.validator.js';
import {
  adjustInventorySchema,
  listInventoryQuery,
  listTransactionsQuery,
} from '../../validators/inventory.validator.js';

const router = Router();

router.get('/', validate({ query: listInventoryQuery }), inventory.listInventory);
router.get('/transactions', validate({ query: listTransactionsQuery }), inventory.listTransactions);
router.patch('/:id', validate({ params: idParam, body: adjustInventorySchema }), inventory.adjustInventory);

export default router;
