import { http } from '@/services/apiClient';

export const wishlistApi = {
  get: () => http.get('/wishlist'),
  ids: () => http.get('/wishlist/ids'),
  add: (productId, variantId) => http.post('/wishlist/items', { productId, ...(variantId && { variantId }) }),
  remove: (productId) => http.delete(`/wishlist/items/${productId}`),
  moveToCart: (productId, variantId) => http.post(`/wishlist/items/${productId}/move-to-cart`, variantId ? { variantId } : {}),
  merge: (productIds) => http.post('/wishlist/merge', { productIds }),
};
