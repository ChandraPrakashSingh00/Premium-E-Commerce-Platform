import { admin } from './request';

export const categoriesApi = {
  list: (params) => admin.get('/categories', params),
  create: (input) => admin.post('/categories', input),
  update: (id, input) => admin.patch(`/categories/${admin.id(id)}`, input),
  remove: (id) => admin.delete(`/categories/${admin.id(id)}`),
  setPublished: (id, isPublished) => admin.patch(`/categories/${admin.id(id)}/publish`, { isPublished }),
};
