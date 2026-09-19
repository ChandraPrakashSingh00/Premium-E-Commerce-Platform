import { Router } from 'express';
import * as users from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { addressIdParam, createAddressSchema, updateAddressSchema } from '../validators/address.validator.js';
import { myReviewsQuery, updatePreferencesSchema, updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

router.use(authenticate);

router.patch('/me', validate({ body: updateProfileSchema }), users.updateProfile);
router.patch('/me/preferences', validate({ body: updatePreferencesSchema }), users.updatePreferences);
router.get('/me/stats', users.getStats);
router.get('/me/reviews', validate({ query: myReviewsQuery }), users.getMyReviews);

router.get('/me/addresses', users.listAddresses);
router.post('/me/addresses', validate({ body: createAddressSchema }), users.createAddress);
router.patch('/me/addresses/:id/default', validate({ params: addressIdParam }), users.setDefaultAddress);
router.patch('/me/addresses/:id', validate({ params: addressIdParam, body: updateAddressSchema }), users.updateAddress);
router.delete('/me/addresses/:id', validate({ params: addressIdParam }), users.deleteAddress);

export default router;
