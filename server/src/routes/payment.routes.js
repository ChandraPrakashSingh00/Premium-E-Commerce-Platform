import { Router } from 'express';
import * as payments from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { checkoutLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import { paymentFailureSchema, verifyPaymentSchema } from '../validators/payment.validator.js';

// POST /razorpay/webhook is registered in app.js (needs the raw body).
const router = Router();

router.get('/config', payments.getPaymentConfig);
router.post(
  '/razorpay/verify',
  authenticate,
  checkoutLimiter,
  validate({ body: verifyPaymentSchema }),
  payments.verifyRazorpayPayment,
);
router.post('/razorpay/failure', authenticate, validate({ body: paymentFailureSchema }), payments.recordRazorpayFailure);

export default router;
