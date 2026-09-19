import { admin } from './request';

export const brandsApi = {
  list: (params) => admin.get('/brands', params),
  create: (input) => admin.post('/brands', input),
  update: (id, input) => admin.patch(`/brands/${admin.id(id)}`, input),
  remove: (id) => admin.delete(`/brands/${admin.id(id)}`),
  setPublished: (id, isPublished) => admin.patch(`/brands/${admin.id(id)}/publish`, { isPublished }),
};
