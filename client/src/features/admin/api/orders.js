import { admin } from './request';

const path = (id, suffix = '') => `/orders/${admin.id(id)}${suffix}`;

export const ordersApi = {
  list: (params) => admin.get('/orders', params),
  get: (id) => admin.get(path(id)),
  updateStatus: (id, body) => admin.patch(path(id, '/status'), body),
  updateTracking: (id, body) => admin.patch(path(id, '/tracking'), body),
  cancel: (id, body) => admin.post(path(id, '/cancel'), body),
  handleReturn: (id, body) => admin.patch(path(id, '/return'), body),
  refund: (id, body) => admin.post(path(id, '/refund'), body),
  markPaid: (id) => admin.patch(path(id, '/payment-status'), { paymentStatus: 'paid' }),
  updateNote: (id, adminNote) => admin.patch(path(id, '/note'), { adminNote }),
};
