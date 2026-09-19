import { admin } from './request';

export const couponsApi = {
  list: (params) => admin.get('/coupons', params),
  get: (id) => admin.get(`/coupons/${admin.id(id)}`),
  create: (input) => admin.post('/coupons', input),
  update: (id, input) => admin.patch(`/coupons/${admin.id(id)}`, input),
  remove: (id) => admin.delete(`/coupons/${admin.id(id)}`),
  setStatus: (id, isActive) => admin.patch(`/coupons/${admin.id(id)}/status`, { isActive }),
};
