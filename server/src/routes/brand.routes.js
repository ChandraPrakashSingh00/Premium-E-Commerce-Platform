import { Router } from 'express';
import { getBrand, listBrands } from '../controllers/brand.controller.js';
import { validate } from '../middleware/validate.js';
import { slugParam } from '../validators/common.validator.js';

const router = Router();

router.get('/', listBrands);
router.get('/:slug', validate({ params: slugParam }), getBrand);

export default router;
