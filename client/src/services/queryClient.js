import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      retry: (count, error) => (error?.status >= 400 && error?.status < 500 ? false : count < 2),
    },
    mutations: { retry: false },
  },
});

/** Centralised query keys – keeps cache invalidation consistent across features. */
export const queryKeys = {
  me: ['auth', 'me'],
  settings: ['store', 'settings'],
  home: ['products', 'home'],
  products: (params) => ['products', 'list', params],
  productFilters: (params) => ['products', 'filters', params],
  product: (slug) => ['products', 'detail', slug],
  related: (slug) => ['products', 'related', slug],
  frequentlyBought: (slug) => ['products', 'fbt', slug],
  suggestions: (q) => ['products', 'suggestions', q],
  categories: ['categories'],
  category: (slug) => ['categories', slug],
  brands: ['brands'],
  reviews: (productId, params) => ['reviews', productId, params],
  reviewEligibility: (productId) => ['reviews', 'eligibility', productId],
  cart: ['cart'],
  cartPreview: (payload) => ['cart', 'preview', payload],
  wishlist: ['wishlist'],
  wishlistIds: ['wishlist', 'ids'],
  addresses: ['account', 'addresses'],
  accountStats: ['account', 'stats'],
  myReviews: (params) => ['account', 'reviews', params],
  orders: (params) => ['orders', 'list', params],
  order: (id) => ['orders', 'detail', id],
  notifications: (params) => ['notifications', params],
  coupons: ['coupons', 'available'],
  admin: (...parts) => ['admin', ...parts],
};
