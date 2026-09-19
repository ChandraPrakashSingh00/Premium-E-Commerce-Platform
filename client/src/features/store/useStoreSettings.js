import { useQuery } from '@tanstack/react-query';
import { http } from '@/services/apiClient';
import { queryKeys } from '@/services/queryClient';

const FALLBACK = {
  storeName: 'BlueMart',
  announcement: 'Free Shipping on Orders Above ₹999',
  freeShippingThreshold: 999,
  shippingFee: 79,
  codEnabled: true,
  returnWindowDays: 7,
  supportEmail: 'support@bluemart.store',
  supportPhone: '+91 98765 43210',
  social: {},
  razorpayEnabled: false,
};

/** Public store settings (announcement, shipping thresholds, contact details). */
export function useStoreSettings() {
  const query = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => http.get('/store/settings'),
    staleTime: 5 * 60_000,
  });
  return { ...query, settings: { ...FALLBACK, ...(query.data ?? {}) } };
}

export const storeApi = {
  subscribe: (email) => http.post('/store/newsletter', { email }),
  contact: (body) => http.post('/store/contact', body),
};
