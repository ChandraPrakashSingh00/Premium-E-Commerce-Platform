import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { checkoutPath } from '@/components/cart/checkoutPath';
import { MAX_QTY_PER_ITEM } from '@/constants';
import { useCart } from '@/features/cart/useCart';
import { stockStatus } from './hooks';

const pickInitialVariant = (variants) => variants.find((v) => v.isDefault && v.inStock) ?? variants.find((v) => v.inStock) ?? variants.find((v) => v.isDefault) ?? variants[0];

/**
 * Purchase state for the product page: selected variant, quantity, derived price/stock
 * and add-to-bag / buy-now actions. Mount with `key={product._id}` to reset.
 */
export function useProductPurchase(product) {
  const navigate = useNavigate();
  const { addItem, isAdding, isGuest } = useCart();
  const variants = useMemo(() => product?.variants ?? [], [product]);
  const [variantId, setVariantId] = useState(() => pickInitialVariant(variants)?._id ?? product?.defaultVariantId ?? null);
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);

  const variant = variants.find((v) => v._id === variantId) ?? null;
  const source = variant ?? product;
  const price = source?.price ?? 0;
  const compareAtPrice = source?.compareAtPrice ?? 0;
  const discount =
    variant && variant.price !== product.price
      ? compareAtPrice > price
        ? Math.round((1 - price / compareAtPrice) * 100)
        : 0
      : (product?.discount ?? 0);
  const stock = source?.stock ?? 0;
  const status = stockStatus(stock, source?.inStock);
  const maxQuantity = Math.max(1, Math.min(MAX_QTY_PER_ITEM, stock || 1));
  const images = variant?.images?.length ? variant.images : (product?.images ?? []);
  const sku = variant?.sku ?? product?.sku;
  const canPurchase = Boolean(variantId) && status.available;

  const selectVariant = (next) => {
    setVariantId(next._id);
    setQuantity((q) => Math.max(1, Math.min(q, next.stock || 1, MAX_QTY_PER_ITEM)));
  };

  const addToBag = () => (canPurchase ? addItem({ variantId, quantity }).catch(() => {}) : undefined);

  const buyNow = async () => {
    if (!canPurchase) return;
    setBuying(true);
    try {
      await addItem({ variantId, quantity, silent: true });
      navigate(checkoutPath(isGuest));
    } catch {
      /* toast shown by useCart */
    } finally {
      setBuying(false);
    }
  };

  return {
    variants,
    variant,
    variantId,
    selectVariant,
    quantity,
    setQuantity,
    maxQuantity,
    price,
    compareAtPrice,
    discount,
    stock,
    status,
    images,
    sku,
    canPurchase,
    addToBag,
    buyNow,
    isAdding: isAdding && !buying,
    isBuying: buying,
  };
}
