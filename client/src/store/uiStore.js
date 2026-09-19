import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/utils/storage';

/** Global UI overlays (only one is open at a time). */
export const useUiStore = create((set) => ({
  overlay: null, // 'search' | 'menu' | 'cart' | null
  open: (overlay) => set({ overlay }),
  close: () => set({ overlay: null }),
}));

/** Recently searched terms (most recent first). */
export const useRecentSearchStore = create(
  persist(
    (set) => ({
      terms: [],
      add: (term) => {
        const t = term.trim();
        if (!t) return;
        set((s) => ({ terms: [t, ...s.terms.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(0, 8) }));
      },
      remove: (term) => set((s) => ({ terms: s.terms.filter((x) => x !== term) })),
      clear: () => set({ terms: [] }),
    }),
    { name: 'bluemart-recent-searches', storage: createJSONStorage(() => safeStorage) },
  ),
);
