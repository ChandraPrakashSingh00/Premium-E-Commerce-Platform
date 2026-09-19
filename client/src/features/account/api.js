import { http } from '@/services/apiClient';

export const accountApi = {
  updateProfile: (body) => http.patch('/users/me', body).then((d) => d.user),
  updatePreferences: (body) => http.patch('/users/me/preferences', body).then((d) => d.user),
  stats: () => http.get('/users/me/stats'),

  addresses: () => http.get('/users/me/addresses'),
  createAddress: (body) => http.post('/users/me/addresses', body),
  updateAddress: (id, body) => http.patch(`/users/me/addresses/${id}`, body),
  deleteAddress: (id) => http.delete(`/users/me/addresses/${id}`),
  setDefaultAddress: (id) => http.patch(`/users/me/addresses/${id}/default`),

  myReviews: (params) => http.get('/users/me/reviews', params),
  deleteReview: (id) => http.delete(`/reviews/${id}`),
};

export const MAX_ADDRESSES = 10;

/** Drops empty optional strings so PATCH/POST bodies stay minimal. */
export const cleanAddress = (values) =>
  Object.fromEntries(Object.entries(values).filter(([key, v]) => v !== '' || ['addressLine2', 'landmark'].includes(key)));
