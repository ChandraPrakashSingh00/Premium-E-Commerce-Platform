import mongoose from 'mongoose';
import multer from 'multer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/apiResponse.js';

export const notFound = (req, _res, next) => next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));

function normalize(err) {
  if (err instanceof AppError) return err;

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return AppError.unprocessable('Validation failed', errors);
  }
  if (err instanceof mongoose.Error.CastError) return AppError.badRequest(`Invalid value for ${err.path}`);
  if (err?.code === 11000) {
    const fields = Object.keys(err.keyValue || err.keyPattern || {});
    return AppError.conflict(`${fields.join(', ') || 'Value'} already exists`, fields.map((f) => ({ field: f, message: 'Already exists' })));
  }
  if (err instanceof multer.MulterError) {
    return AppError.badRequest(err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message);
  }
  if (err?.type === 'entity.too.large') return new AppError('Request body is too large', 413, [], 'PAYLOAD_TOO_LARGE');
  if (err?.type === 'entity.parse.failed') return AppError.badRequest('Malformed JSON body');
  // Malformed percent-encoding in the URL and other client errors raised by Express/body-parser.
  if (err instanceof URIError) return AppError.badRequest('Malformed URL');
  if (err?.expose && err.status >= 400 && err.status < 500) return new AppError(err.message, err.status, [], 'BAD_REQUEST');
  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') return AppError.unauthorized('Invalid or expired token');

  return null;
}

export function globalErrorHandler(err, req, res, _next) {
  const known = normalize(err);
  const statusCode = known?.statusCode ?? 500;

  if (statusCode >= 500) {
    (req.log ?? logger).error({ err, requestId: req.id }, 'Unhandled error');
  } else {
    (req.log ?? logger).debug({ message: err.message, statusCode }, 'Request failed');
  }

  const expose = known || !env.isProd;
  return sendError(res, {
    statusCode,
    message: expose ? (known?.message ?? err.message) : 'Something went wrong',
    errors: known?.errors ?? (env.isProd ? [] : [{ message: err.message, stack: err.stack?.split('\n').slice(0, 5) }]),
    code: known?.code ?? 'INTERNAL_ERROR',
  });
}
