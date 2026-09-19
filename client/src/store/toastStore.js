import { create } from 'zustand';

let nextId = 1;

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: ({ title, description, tone = 'default', duration = 4000, action }) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, title, description, tone, action }] }));
    if (duration > 0) setTimeout(() => get().dismiss(id), duration);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper usable outside React components. */
export const toast = {
  show: (opts) => useToastStore.getState().push(opts),
  success: (title, description) => useToastStore.getState().push({ title, description, tone: 'success' }),
  error: (title, description) => useToastStore.getState().push({ title, description, tone: 'error', duration: 6000 }),
  info: (title, description) => useToastStore.getState().push({ title, description, tone: 'default' }),
};
