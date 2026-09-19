import { Router } from 'express';
import { deleteImage, uploadImages } from '../../controllers/admin/upload.controller.js';
import { uploadImages as uploadMiddleware } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { deleteImageSchema, uploadFolderQuery } from '../../validators/upload.validator.js';

const router = Router();

router.post('/images', validate({ query: uploadFolderQuery }), uploadMiddleware, uploadImages);
router.delete('/images', validate({ body: deleteImageSchema }), deleteImage);

export default router;
