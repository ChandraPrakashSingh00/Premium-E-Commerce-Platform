import { http } from '@/services/apiClient';

export const reviewsApi = {
  list: (productId, params) => http.get(`/reviews/product/${productId}`, params),
  eligibility: (productId) => http.get(`/reviews/eligibility/${productId}`),
  create: (body) => http.post('/reviews', body),
  update: (id, body) => http.patch(`/reviews/${id}`, body),
  remove: (id) => http.delete(`/reviews/${id}`),
  toggleHelpful: (id) => http.post(`/reviews/${id}/helpful`),
  uploadImages: (files) => {
    const form = new FormData();
    files.forEach((file) => form.append('images', file));
    return http.post('/reviews/images', form);
  },
};
