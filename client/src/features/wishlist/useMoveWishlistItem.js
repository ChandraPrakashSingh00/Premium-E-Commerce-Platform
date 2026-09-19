import { useState } from 'react';
import { useCart } from '@/features/cart/useCart';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { useGuestWishlistStore } from '@/store/guestWishlistStore';
import { toast } from '@/store/toastStore';
import { useMoveToCart } from './useWishlist';

/** Wishlist items with several variants and no saved choice need the product page. */
export const needsVariantChoice = ({ product, variantId }) => !variantId && product.variantCount > 1;

/**
 * Moves a wishlist entry into the bag.
 * Signed-in → POST /wishlist/items/:id/move-to-cart. Guest → add the default variant
 * to the guest cart, then remove it from the guest wishlist.
 */
export function useMoveWishlistItem() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const moveToCart = useMoveToCart();
  const { addItem } = useCart();
  const [pendingId, setPendingId] = useState(null);

  const move = async ({ product, variantId }) => {
    setPendingId(product._id);
    try {
      if (isAuthenticated) {
        await moveToCart.mutateAsync({ productId: product._id, variantId: variantId ?? undefined });
      } else {
        const id = variantId ?? product.defaultVariantId;
        await addItem({ variantId: id, quantity: 1, silent: true });
        useGuestWishlistStore.getState().remove(product._id);
        toast.success('Moved to your bag');
      }
    } catch {
      /* errors are surfaced by the underlying mutations */
    } finally {
      setPendingId(null);
    }
  };

  return { move, pendingId };
}
