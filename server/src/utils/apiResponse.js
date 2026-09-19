/**
 * Centralised response helpers. Every JSON response has the shape
 *   { success, message, data }            on success
 *   { success, message, errors }          on failure
 * Paginated lists put `{ items, pagination }` inside `data`.
 */
export const sendSuccess = (res, { data = null, message = 'Request successful', statusCode = 200 } = {}) =>
  res.status(statusCode).json({ success: true, message, data });

export const sendCreated = (res, data, message = 'Created successfully') =>
  sendSuccess(res, { data, message, statusCode: 201 });

export const sendPaginated = (res, { items, pagination, message = 'Request successful', meta }) =>
  sendSuccess(res, { data: { items, pagination, ...(meta && { meta }) }, message });

export const sendError = (res, { message = 'Something went wrong', statusCode = 500, errors = [], code } = {}) =>
  res.status(statusCode).json({ success: false, message, errors, ...(code && { code }) });
