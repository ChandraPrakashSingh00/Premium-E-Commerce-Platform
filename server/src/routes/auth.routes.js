import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { emailLimiter, loginLimiter, refreshLimiter, registerLimiter, tokenLimiter } from '../middleware/rateLimiters.js';
import { validate } from '../middleware/validate.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordParams,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', registerLimiter, validate({ body: registerSchema }), auth.register);
router.post('/login', loginLimiter, validate({ body: loginSchema }), auth.login);
router.post('/admin/login', loginLimiter, validate({ body: loginSchema }), auth.adminLogin);
router.post('/refresh', refreshLimiter, auth.refresh);
router.post('/logout', auth.logout);
router.post('/logout-all', authenticate, auth.logoutAll);
router.get('/me', authenticate, auth.me);
router.post('/forgot-password', emailLimiter, validate({ body: forgotPasswordSchema }), auth.forgotPassword);
router.post(
  '/reset-password/:token',
  tokenLimiter,
  validate({ params: resetPasswordParams, body: resetPasswordSchema }),
  auth.resetPassword,
);
router.post('/verify-email', tokenLimiter, validate({ body: verifyEmailSchema }), auth.verifyEmail);
router.post('/resend-verification', emailLimiter, authenticate, auth.resendVerification);
router.patch('/change-password', tokenLimiter, authenticate, validate({ body: changePasswordSchema }), auth.changePassword);

export default router;
