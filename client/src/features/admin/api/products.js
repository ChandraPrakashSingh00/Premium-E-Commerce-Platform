import { admin } from './request';

export const productsApi = {
  list: (params) => admin.get('/products', params),
  get: (id) => admin.get(`/products/${admin.id(id)}`),
  create: (input) => admin.post('/products', input),
  update: (id, input) => admin.patch(`/products/${admin.id(id)}`, input),
  remove: (id) => admin.delete(`/products/${admin.id(id)}`),
  setPublished: (id, isPublished) => admin.patch(`/products/${admin.id(id)}/publish`, { isPublished }),
};
