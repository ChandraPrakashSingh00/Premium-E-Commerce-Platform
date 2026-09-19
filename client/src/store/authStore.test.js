import { beforeEach, describe, expect, it } from 'vitest';
import { hasSessionHint, useAuthStore } from './authStore';

describe('authStore session hint', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({ user: null, status: 'idle' });
  });

  it('is absent for a fresh browser', () => {
    expect(hasSessionHint()).toBe(false);
  });

  it('is set on sign-in and removed on sign-out', () => {
    useAuthStore.getState().setUser({ _id: '1', name: 'Asha', role: 'USER' });
    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(hasSessionHint()).toBe(true);

    useAuthStore.getState().clear();
    expect(useAuthStore.getState().status).toBe('guest');
    expect(hasSessionHint()).toBe(false);
  });
});
