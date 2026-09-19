import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { sendError } from '../utils/apiResponse.js';

const handler = (_req, res) =>
  sendError(res, { statusCode: 429, message: 'Too many requests, please try again later', code: 'RATE_LIMITED' });

/**
 * Each export is its own limiter instance (and therefore its own counter), so
 * e.g. browsing that triggers token refreshes can never lock a visitor out of login.
 */
const make = (windowMs, limit, extra = {}) =>
  rateLimit({
    windowMs,
    limit: env.isTest ? 10_000 : limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler,
    ...extra,
  });

const MIN = 60 * 1000;

/** Applies to the whole API. */
export const apiLimiter = make(15 * MIN, 1000);
/** Login / admin login: only failed attempts count (brute-force protection). */
export const loginLimiter = make(15 * MIN, 10, { skipSuccessfulRequests: true });
/** Account creation. */
export const registerLimiter = make(60 * MIN, 10);
/** Token refresh happens on page loads; generous but bounded. */
export const refreshLimiter = make(15 * MIN, 200);
/** Token-based endpoints (reset password, verify email) and password change. */
export const tokenLimiter = make(15 * MIN, 20);
/** Emails sent on request: forgot password, resend verification. */
export const emailLimiter = make(60 * MIN, 10);
/** Public forms: newsletter and contact. */
export const formLimiter = make(60 * MIN, 20);
/** Checkout and payment creation. */
export const checkoutLimiter = make(10 * MIN, 30);
