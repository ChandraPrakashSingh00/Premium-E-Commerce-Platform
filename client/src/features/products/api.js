import { http } from '@/services/apiClient';

/** Drops empty values so query keys and URLs stay canonical. */
export const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== false));

export const productsApi = {
  list: (params) => http.get('/products', cleanParams(params)),
  filters: (params) => http.get('/products/filters', cleanParams(params)),
  suggestions: (q) => http.get('/products/suggestions', { q }),
  home: () => http.get('/products/home'),
  detail: (slug) => http.get(`/products/${encodeURIComponent(slug)}`),
  related: (slug, limit = 8) => http.get(`/products/${encodeURIComponent(slug)}/related`, { limit }),
  frequentlyBought: (slug, limit = 4) => http.get(`/products/${encodeURIComponent(slug)}/frequently-bought`, { limit }),
};
