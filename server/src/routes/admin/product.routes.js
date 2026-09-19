import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  publishProduct,
  updateProduct,
} from '../../controllers/admin/product.controller.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../validators/common.validator.js';
import {
  adminProductListQuery,
  createProductSchema,
  publishProductSchema,
  updateProductSchema,
} from '../../validators/adminProduct.validator.js';

const router = Router();

router.get('/', validate({ query: adminProductListQuery }), listProducts);
router.post('/', validate({ body: createProductSchema }), createProduct);
router.get('/:id', validate({ params: idParam }), getProduct);
router.patch('/:id', validate({ params: idParam, body: updateProductSchema }), updateProduct);
router.patch('/:id/publish', validate({ params: idParam, body: publishProductSchema }), publishProduct);
router.delete('/:id', validate({ params: idParam }), deleteProduct);

export default router;
