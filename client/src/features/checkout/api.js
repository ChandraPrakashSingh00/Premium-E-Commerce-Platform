import { http } from '@/services/apiClient';

export const checkoutApi = {
  /** CartView + `{ codAvailable, codUnavailableReason? }` priced for the payment method. */
  quote: (paymentMethod) => http.post('/orders/quote', paymentMethod ? { paymentMethod } : {}),
  /** 201 `{ order, payment }` – the same key always resolves to the same order. */
  createOrder: (idempotencyKey, body) => http.post('/orders', body, { headers: { 'X-Idempotency-Key': idempotencyKey } }),
  verifyPayment: (body) => http.post('/payments/razorpay/verify', body),
  reportFailure: (body) => http.post('/payments/razorpay/failure', body),
  paymentConfig: () => http.get('/payments/config'),
};
