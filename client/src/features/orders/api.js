import { http } from '@/services/apiClient';

export const ordersApi = {
  list: (params) => http.get('/orders', params),
  get: (id) => http.get(`/orders/${id}`),
  cancel: (id, reason) => http.post(`/orders/${id}/cancel`, { reason }),
  requestReturn: (id, body) => http.post(`/orders/${id}/return`, body),
  /** Returns `{ order, payment: RazorpayCheckout }` for a pending online order. */
  pay: (id) => http.post(`/orders/${id}/pay`),
};
