import { http } from '@/services/apiClient';

/** Drops empty values so query keys and URLs stay canonical. */
export const clean = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));

const id = (value) => encodeURIComponent(value);

export const admin = {
  get: (path, params) => http.get(`/admin${path}`, clean(params)),
  post: (path, body, opts) => http.post(`/admin${path}`, body, opts),
  patch: (path, body) => http.patch(`/admin${path}`, body),
  delete: (path, opts) => http.delete(`/admin${path}`, opts),
  id,
};
