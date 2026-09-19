import { admin } from './request';

export const reviewsApi = {
  list: (params) => admin.get('/reviews', params),
  update: (id, body) => admin.patch(`/reviews/${admin.id(id)}`, body),
  remove: (id) => admin.delete(`/reviews/${admin.id(id)}`),
};
