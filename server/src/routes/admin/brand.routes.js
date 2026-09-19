import { Router } from 'express';
import { createBrand, deleteBrand, listBrands, publishBrand, updateBrand } from '../../controllers/admin/brand.controller.js';
import { validate } from '../../middleware/validate.js';
import { idParam } from '../../validators/common.validator.js';
import { adminBrandQuery, createBrandSchema, publishSchema, updateBrandSchema } from '../../validators/brand.validator.js';

const router = Router();

router.get('/', validate({ query: adminBrandQuery }), listBrands);
router.post('/', validate({ body: createBrandSchema }), createBrand);
router.patch('/:id', validate({ params: idParam, body: updateBrandSchema }), updateBrand);
router.patch('/:id/publish', validate({ params: idParam, body: publishSchema }), publishBrand);
router.delete('/:id', validate({ params: idParam }), deleteBrand);

export default router;
