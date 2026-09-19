import { admin } from './request';

export const customersApi = {
  list: (params) => admin.get('/customers', params),
  get: (id) => admin.get(`/customers/${admin.id(id)}`),
  setStatus: (id, status) => admin.patch(`/customers/${admin.id(id)}/status`, { status }),
};
