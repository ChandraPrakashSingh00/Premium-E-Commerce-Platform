import { AppError } from '../utils/AppError.js';

const formatIssues = (issues, location) =>
  issues.map((i) => ({ field: [location, ...i.path].join('.'), message: i.message }));

/**
 * Validates request parts against zod schemas.
 *   validate({ body, query, params })
 * Parsed (coerced + stripped) values are written to:
 *   req.body, req.params, and req.validatedQuery (Express 5 makes req.query read-only).
 */
export const validate = (schemas) => (req, _res, next) => {
  const errors = [];
  for (const location of ['params', 'query', 'body']) {
    const schema = schemas[location];
    if (!schema) continue;
    const result = schema.safeParse(req[location] ?? {});
    if (!result.success) {
      errors.push(...formatIssues(result.error.issues, location));
      continue;
    }
    if (location === 'query') req.validatedQuery = result.data;
    else if (location === 'params') Object.assign(req.params, result.data);
    else req.body = result.data;
  }
  if (errors.length) return next(AppError.unprocessable('Validation failed', errors));
  return next();
};
