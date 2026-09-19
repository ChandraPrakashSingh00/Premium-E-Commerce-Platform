import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  listCategories,
  publishCategory,
  updateCategory,
} from '../../controllers/admin/category.controller.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../validators/common.validator.js';
import {
  adminCategoryQuery,
  createCategorySchema,
  publishSchema,
  updateCategorySchema,
} from '../../validators/category.validator.js';

const router = Router();

router.get('/', validate({ query: adminCategoryQuery }), listCategories);
router.post('/', validate({ body: createCategorySchema }), createCategory);
router.patch('/:id', validate({ params: idParam, body: updateCategorySchema }), updateCategory);
router.patch('/:id/publish', validate({ params: idParam, body: publishSchema }), publishCategory);
router.delete('/:id', validate({ params: idParam }), deleteCategory);

export default router;
