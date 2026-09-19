import { beforeEach, describe, expect, it } from 'vitest';
import { useGuestCartStore } from './guestCartStore';

const state = () => useGuestCartStore.getState();

describe('guestCartStore', () => {
  beforeEach(() => {
    useGuestCartStore.setState({ items: [], couponCode: null });
  });

  it('adds new items and merges quantities for the same variant', () => {
    state().add('v1', 2);
    state().add('v2');
    state().add('v1', 3);
    expect(state().items).toEqual([
      { variantId: 'v1', quantity: 5 },
      { variantId: 'v2', quantity: 1 },
    ]);
  });

  it('caps quantities at 10 per item', () => {
    state().add('v1', 8);
    state().add('v1', 5);
    expect(state().items).toEqual([{ variantId: 'v1', quantity: 10 }]);
    state().add('v2', 25);
    expect(state().items[1]).toEqual({ variantId: 'v2', quantity: 10 });
  });

  it('updates quantities within 1–10', () => {
    state().add('v1', 2);
    state().update('v1', 4);
    expect(state().items[0].quantity).toBe(4);
    state().update('v1', 50);
    expect(state().items[0].quantity).toBe(10);
    state().update('v1', 0);
    expect(state().items[0].quantity).toBe(1);
  });

  it('removes items and clears the cart', () => {
    state().add('v1');
    state().add('v2');
    state().remove('v1');
    expect(state().items).toEqual([{ variantId: 'v2', quantity: 1 }]);
    state().setCoupon('FESTIVE20');
    state().clear();
    expect(state().items).toEqual([]);
    expect(state().couponCode).toBeNull();
  });
});
