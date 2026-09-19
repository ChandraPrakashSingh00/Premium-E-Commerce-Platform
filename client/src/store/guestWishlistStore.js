import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/utils/storage';

/** Wishlist for signed-out shoppers (product ids). Synced to the server after login. */
export const useGuestWishlistStore = create(
  persist(
    (set) => ({
      productIds: [],
      toggle: (productId) =>
        set((s) => ({
          productIds: s.productIds.includes(productId)
            ? s.productIds.filter((id) => id !== productId)
            : [productId, ...s.productIds].slice(0, 200),
        })),
      remove: (productId) => set((s) => ({ productIds: s.productIds.filter((id) => id !== productId) })),
      clear: () => set({ productIds: [] }),
    }),
    { name: 'bluemart-guest-wishlist', version: 1, storage: createJSONStorage(() => safeStorage) },
  ),
);
