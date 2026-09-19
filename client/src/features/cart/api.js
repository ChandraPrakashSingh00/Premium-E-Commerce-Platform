import { http } from '@/services/apiClient';

export const cartApi = {
  get: () => http.get('/cart'),
  addItem: ({ variantId, quantity }) => http.post('/cart/items', { variantId, quantity }),
  updateItem: (itemId, quantity) => http.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId) => http.delete(`/cart/items/${itemId}`),
  clear: () => http.delete('/cart'),
  merge: (items) => http.post('/cart/merge', { items }),
  applyCoupon: (code) => http.post('/cart/coupon', { code }),
  removeCoupon: () => http.delete('/cart/coupon'),
  preview: ({ items, couponCode }) => http.post('/cart/preview', { items, ...(couponCode && { couponCode }) }),
  availableCoupons: () => http.get('/coupons/available'),
};

export const EMPTY_CART = Object.freeze({
  items: [],
  summary: {
    itemCount: 0,
    subtotal: 0,
    discount: 0,
    couponDiscount: 0,
    tax: 0,
    shipping: 0,
    codFee: 0,
    total: 0,
    freeShippingThreshold: 0,
    amountToFreeShipping: 0,
  },
  coupon: null,
  couponError: null,
  hasIssues: false,
});
