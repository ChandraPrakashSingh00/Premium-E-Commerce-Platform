/**
 * Operational error with an HTTP status. Anything thrown that is NOT an AppError
 * is treated as a bug and reported as a generic 500 in production.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errors = [], code) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Bad request', errors = []) {
    return new AppError(message, 400, errors, 'BAD_REQUEST');
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401, [], 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(message, 403, [], 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, [], 'NOT_FOUND');
  }

  static conflict(message = 'Resource already exists', errors = []) {
    return new AppError(message, 409, errors, 'CONFLICT');
  }

  static unprocessable(message = 'Validation failed', errors = []) {
    return new AppError(message, 422, errors, 'VALIDATION_ERROR');
  }

  static tooMany(message = 'Too many requests, please try again later') {
    return new AppError(message, 429, [], 'RATE_LIMITED');
  }

  static unavailable(message = 'Service unavailable') {
    return new AppError(message, 503, [], 'SERVICE_UNAVAILABLE');
  }
}
