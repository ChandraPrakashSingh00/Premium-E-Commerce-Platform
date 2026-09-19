import { Router } from 'express';
import * as store from '../controllers/store.controller.js';
import { formLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { contactSchema, newsletterSchema } from '../validators/store.validator.js';

const router = Router();

router.get('/settings', store.getPublicSettings);
router.post('/newsletter', formLimiter, validate({ body: newsletterSchema }), store.subscribeNewsletter);
router.post('/contact', formLimiter, validate({ body: contactSchema }), store.submitContact);

export default router;
