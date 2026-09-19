import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MAX_QTY_PER_ITEM } from '@/constants';
import { safeStorage } from '@/utils/storage';

/**
 * Cart for signed-out shoppers. Only variant ids + quantities are stored;
 * prices always come from the server (`POST /cart/preview`).
 * Merged into the server cart right after login.
 */
export const useGuestCartStore = create(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      add: (variantId, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.variantId === variantId);
          const items = existing
            ? s.items.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.min(MAX_QTY_PER_ITEM, i.quantity + quantity) } : i))
            : [...s.items, { variantId, quantity: Math.min(MAX_QTY_PER_ITEM, quantity) }];
          return { items };
        }),
      update: (variantId, quantity) =>
        set((s) => ({
          items: s.items.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.max(1, Math.min(MAX_QTY_PER_ITEM, quantity)) } : i)),
        })),
      remove: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      setCoupon: (couponCode) => set({ couponCode }),
      clear: () => set({ items: [], couponCode: null }),
    }),
    { name: 'bluemart-guest-cart', version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
);
