import { http } from '@/services/apiClient';

export const categoriesApi = {
  tree: () => http.get('/categories'),
  detail: (slug) => http.get(`/categories/${encodeURIComponent(slug)}`),
  brands: () => http.get('/brands'),
};
