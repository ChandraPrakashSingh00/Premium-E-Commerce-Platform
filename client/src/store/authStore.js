import { create } from 'zustand';
import { storage } from '@/utils/storage';

const SESSION_HINT_KEY = 'bluemart-has-session';

/**
 * Whether this browser has signed in before (and not signed out). Tokens live in
 * HTTP-only cookies we cannot read, so this hint lets guests skip pointless
 * `/auth/refresh` calls. It is only an optimisation – the server decides.
 */
export const hasSessionHint = () => storage.get(SESSION_HINT_KEY, false) === true;

/**
 * Session state. Tokens are in HTTP-only cookies, so the store only keeps the
 * user profile. `status`: 'idle' → 'loading' → 'authenticated' | 'guest'.
 */
export const useAuthStore = create((set) => ({
  user: null,
  status: 'idle',
  setUser: (user) => {
    if (user) storage.set(SESSION_HINT_KEY, true);
    else storage.remove(SESSION_HINT_KEY);
    set({ user, status: user ? 'authenticated' : 'guest' });
  },
  setStatus: (status) => set({ status }),
  clear: () => {
    storage.remove(SESSION_HINT_KEY);
    set({ user: null, status: 'guest' });
  },
}));

export const selectIsAuthenticated = (s) => s.status === 'authenticated';
export const selectIsAdmin = (s) => s.user?.role === 'ADMIN';
