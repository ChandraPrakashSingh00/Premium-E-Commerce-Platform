import crypto from 'node:crypto';
import { isAllowedOrigin } from '../config/cors.js';
import { AppError } from '../utils/AppError.js';

const FORBIDDEN_KEY = /^\$|\./;
const HTML_TAG = /<\s*\/?\s*(script|iframe|object|embed|style|link|meta|svg|img)[^>]*>/gi;
const EVENT_HANDLER = /\son\w+\s*=/gi;

/**
 * Removes keys that could be interpreted as MongoDB operators ($gt, a.b) and
 * strips dangerous HTML from strings. Mutates plain objects in place.
 */
export function sanitizeValue(value, depth = 0) {
  if (depth > 20) return undefined;
  if (typeof value === 'string') return value.replace(HTML_TAG, '').replace(EVENT_HANDLER, ' ');
  if (Array.isArray(value)) return value.map((v) => sanitizeValue(v, depth + 1));
  if (value && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value)) {
    for (const key of Object.keys(value)) {
      if (FORBIDDEN_KEY.test(key) || key === '__proto__' || key === 'constructor' || key === 'prototype') {
        delete value[key];
      } else {
        value[key] = sanitizeValue(value[key], depth + 1);
      }
    }
  }
  return value;
}

export function sanitizeRequest(req, _res, next) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  // Express 5: req.query is a getter; sanitize its (mutable) resulting object.
  if (req.query && typeof req.query === 'object') sanitizeValue(req.query);
  next();
}

export function requestId(req, res, next) {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

/**
 * CSRF defence for cookie-authenticated, state-changing requests: browsers always
 * send Origin on cross-site POST/PUT/PATCH/DELETE, so reject unknown origins.
 * Requests without Origin (server-to-server, webhooks, curl) carry no ambient
 * browser cookies and are not a CSRF vector.
 */
export function csrfOriginCheck(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !isAllowedOrigin(origin)) return next(AppError.forbidden('Origin not allowed'));
  return next();
}
