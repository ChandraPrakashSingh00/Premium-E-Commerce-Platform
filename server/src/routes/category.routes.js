import { Router } from 'express';
import { getCategory, getCategoryTree } from '../controllers/category.controller.js';
import { validate } from '../middleware/validate.js';
import { slugParam } from '../validators/common.validator.js';

const router = Router();

router.get('/', getCategoryTree);
router.get('/:slug', validate({ params: slugParam }), getCategory);

export default router;
