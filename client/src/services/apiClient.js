import axios from 'axios';
import { config } from '@/config/env';
import { hasSessionHint } from '@/store/authStore';

/**
 * Shared axios instance. Auth lives in HTTP-only cookies, so requests are sent
 * `withCredentials`. On a 401 the client transparently calls /auth/refresh once
 * (single-flight for concurrent requests) and replays the original request.
 */
export const api = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
  timeout: 20000,
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
});

const NO_REFRESH = ['/auth/login', '/auth/admin/login', '/auth/register', '/auth/refresh', '/auth/logout'];

let refreshPromise = null;
let onSessionExpired = () => {};

/** Registers a callback invoked when refreshing fails (session is gone). */
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

export const refreshSession = () => {
  refreshPromise ??= api.post('/auth/refresh', null, { _skipRefresh: true }).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const skip =
      !original ||
      original._retry ||
      original._skipRefresh ||
      !hasSessionHint() ||
      NO_REFRESH.some((p) => original.url?.startsWith(p));
    if (status === 401 && !skip) {
      original._retry = true;
      try {
        await refreshSession();
        return api(original);
      } catch (refreshError) {
        // Another tab rotated the session a moment ago; its cookies are already ours.
        if (refreshError.response?.data?.code === 'REFRESH_RACE') return api(original);
        onSessionExpired();
        return Promise.reject(normalizeError(refreshError));
      }
    }
    return Promise.reject(normalizeError(error));
  },
);

export class ApiError extends Error {
  constructor(message, { status, errors = [], code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.code = code;
  }
}

function normalizeError(error) {
  if (error instanceof ApiError) return error;
  if (error.response) {
    const { data, status } = error.response;
    return new ApiError(data?.message || 'Something went wrong', { status, errors: data?.errors, code: data?.code });
  }
  if (error.code === 'ECONNABORTED') return new ApiError('The request timed out. Please try again.', { status: 0, code: 'TIMEOUT' });
  return new ApiError('Network error. Check your connection and try again.', { status: 0, code: 'NETWORK_ERROR' });
}

/** Unwraps the `{ success, data }` envelope. */
export const unwrap = (promise) => promise.then((res) => res.data.data);

export const getErrorMessage = (error, fallback = 'Something went wrong') => error?.message || fallback;

/** Maps API validation errors (`body.email`) onto react-hook-form fields. */
export function applyFieldErrors(error, setError) {
  let applied = false;
  for (const e of error?.errors ?? []) {
    const field = e.field?.replace(/^(body|query|params)\./, '');
    if (field) {
      setError(field, { type: 'server', message: e.message });
      applied = true;
    }
  }
  return applied;
}

export const http = {
  get: (url, params, opts) => unwrap(api.get(url, { params, ...opts })),
  post: (url, body, opts) => unwrap(api.post(url, body, opts)),
  patch: (url, body, opts) => unwrap(api.patch(url, body, opts)),
  put: (url, body, opts) => unwrap(api.put(url, body, opts)),
  delete: (url, opts) => unwrap(api.delete(url, opts)),
};
