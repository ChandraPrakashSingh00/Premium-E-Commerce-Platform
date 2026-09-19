import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/store/authStore';
import { useGuestWishlistStore } from '@/store/guestWishlistStore';
import { formatPrice } from '@/utils/format';
import { ProductCard } from './ProductCard';

vi.mock('@/services/apiClient', () => ({
  http: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
  applyFieldErrors: vi.fn(),
  ApiError: class ApiError extends Error {},
}));

const baseProduct = {
  _id: 'p1',
  name: 'Linen Relaxed Shirt',
  slug: 'linen-relaxed-shirt',
  thumbnail: 'https://example.com/shirt.jpg',
  images: [{ url: 'https://example.com/shirt.jpg', alt: 'Linen shirt' }],
  brand: { _id: 'b1', name: 'Everloom', slug: 'everloom' },
  category: { _id: 'c1', name: 'Men', slug: 'men' },
  price: 1999,
  compareAtPrice: 2499,
  discount: 20,
  ratingAverage: 4.5,
  reviewCount: 12,
  stock: 14,
  inStock: true,
  isFeatured: false,
  isBestSeller: true,
  isNewArrival: false,
  defaultVariantId: 'v1',
  variantCount: 1,
  options: { sizes: [], colors: [] },
};

function renderCard(product = baseProduct) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ProductCard', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: 'guest' });
    useGuestWishlistStore.setState({ productIds: [] });
  });

  it('renders brand, name, price and discount', () => {
    renderCard();
    expect(screen.getByText('Everloom')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Linen Relaxed Shirt' })).toHaveAttribute('href', '/product/linen-relaxed-shirt');
    expect(screen.getByText(formatPrice(1999))).toBeInTheDocument();
    expect(screen.getByText(formatPrice(2499))).toBeInTheDocument();
    expect(screen.getByText('-20%')).toBeInTheDocument();
    expect(screen.getByText('20% off')).toBeInTheDocument();
    expect(screen.getByText('Bestseller')).toBeInTheDocument();
    const addToCart = screen.getByRole('button', { name: /add linen relaxed shirt to cart/i });
    expect(addToCart).toBeEnabled();
    expect(addToCart).toHaveTextContent('Add to Cart');
  });

  it('shows the out-of-stock state and disables add to cart', () => {
    renderCard({ ...baseProduct, stock: 0, inStock: false });
    expect(screen.getByText('Sold out')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Out of Stock' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: /add .* to cart/i })).not.toBeInTheDocument();
    expect(screen.queryByText('-20%')).not.toBeInTheDocument();
  });

  it('links to the product page when the product has several variants', () => {
    renderCard({ ...baseProduct, variantCount: 3 });
    expect(screen.getByRole('link', { name: /view options for linen relaxed shirt/i })).toHaveAttribute('href', '/product/linen-relaxed-shirt');
    expect(screen.queryByRole('button', { name: /add .* to cart/i })).not.toBeInTheDocument();
  });

  it('toggles the guest wishlist', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /save linen relaxed shirt to wishlist/i }));
    expect(await screen.findByRole('button', { name: /remove linen relaxed shirt from wishlist/i })).toHaveAttribute('aria-pressed', 'true');
    expect(useGuestWishlistStore.getState().productIds).toEqual(['p1']);

    fireEvent.click(screen.getByRole('button', { name: /remove linen relaxed shirt from wishlist/i }));
    expect(await screen.findByRole('button', { name: /save linen relaxed shirt to wishlist/i })).toHaveAttribute('aria-pressed', 'false');
    expect(useGuestWishlistStore.getState().productIds).toEqual([]);
  });
});
