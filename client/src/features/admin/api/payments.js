import { admin } from './request';

export const paymentsApi = {
  list: (params) => admin.get('/payments', params),
  get: (id) => admin.get(`/payments/${admin.id(id)}`),
};
