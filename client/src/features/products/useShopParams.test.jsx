import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { useShopParams } from './useShopParams';

function setup(initial = '/shop') {
  const wrapper = ({ children }) => <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>;
  return renderHook(() => ({ shop: useShopParams(), location: useLocation() }), { wrapper });
}

const query = (result) => new URLSearchParams(result.current.location.search);

describe('useShopParams', () => {
  it('reads filters from the URL', () => {
    const { result } = setup('/shop?brand=everloom,atlas-leather&minPrice=500&inStock=true&page=2&sort=newest');
    const { shop } = result.current;
    expect(shop.filters.brand).toEqual(['everloom', 'atlas-leather']);
    expect(shop.filters.minPrice).toBe('500');
    expect(shop.filters.inStock).toBe(true);
    expect(shop.page).toBe(2);
    expect(shop.sort).toBe('newest');
    expect(shop.activeCount).toBe(4);
  });

  it('updates the URL and resets the page when a filter changes', () => {
    const { result } = setup('/shop?page=3&sort=price-low');
    act(() => result.current.shop.setParam('rating', 4));
    const params = query(result);
    expect(params.get('rating')).toBe('4');
    expect(params.get('page')).toBeNull();
    expect(params.get('sort')).toBe('price-low');
    expect(result.current.shop.filters.rating).toBe('4');
  });

  it('toggles comma-separated list values', () => {
    const { result } = setup('/shop?page=2');
    act(() => result.current.shop.toggleListValue('size', 'M'));
    act(() => result.current.shop.toggleListValue('size', 'L'));
    expect(query(result).get('size')).toBe('M,L');
    expect(query(result).get('page')).toBeNull();
    act(() => result.current.shop.toggleListValue('size', 'm'));
    expect(query(result).get('size')).toBe('L');
  });

  it('keeps filters when paginating and removes empty values', () => {
    const { result } = setup('/shop?color=Black');
    act(() => result.current.shop.setPage(3));
    expect(query(result).get('page')).toBe('3');
    expect(query(result).get('color')).toBe('Black');
    act(() => result.current.shop.setParams({ color: [], minPrice: '' }));
    expect(query(result).get('color')).toBeNull();
    expect(query(result).get('page')).toBeNull();
  });

  it('clears filters but keeps search, sort and collection flags', () => {
    const { result } = setup('/shop?q=shirt&sort=newest&newArrival=true&brand=everloom&page=2');
    act(() => result.current.shop.clearFilters());
    const params = query(result);
    expect(params.get('q')).toBe('shirt');
    expect(params.get('sort')).toBe('newest');
    expect(params.get('newArrival')).toBe('true');
    expect(params.get('brand')).toBeNull();
    expect(params.get('page')).toBeNull();
  });
});
