import { forwardRef } from 'react';
import { Link } from 'react-router';
import { Heart, ShoppingCart, Zap } from 'lucide-react';
import { Badge, Button, QuantityStepper, Rating } from '@/components/ui';
import { useToggleWishlist, useWishlistIds } from '@/features/wishlist/useWishlist';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';
import { VariantSelector } from '../VariantSelector';
import { TrustRows } from './TrustRows';

const STOCK_TONE = { success: 'text-success-600', warning: 'text-warning-600', danger: 'text-danger-600' };

function WishlistToggle({ product, variantId }) {
  const ids = useWishlistIds();
  const { toggle } = useToggleWishlist();
  const saved = ids.has(product._id);
  return (
    <button
      type="button"
      aria-pressed={saved}
      onClick={() => toggle(product._id, variantId)}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-ink-700 transition-colors hover:text-brand-600"
    >
      <Heart size={18} className={cn(saved && 'fill-danger-500 text-danger-500')} aria-hidden="true" />
      {saved ? 'Saved to Wishlist' : 'Add to Wishlist'}
    </button>
  );
}

function PriceBlock({ purchase }) {
  const { price, compareAtPrice, discount } = purchase;
  const hasDiscount = compareAtPrice > price;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-display text-3xl font-bold tracking-tight text-ink-900 tabular-nums sm:text-[34px]">{formatPrice(price)}</span>
        {hasDiscount && (
          <span className="text-lg text-ink-400 line-through tabular-nums">
            <span className="sr-only">Original price </span>
            {formatPrice(compareAtPrice)}
          </span>
        )}
        {hasDiscount && discount > 0 && (
          <span className="rounded-md bg-success-50 px-2 py-1 text-xs font-bold tracking-wide text-success-600 uppercase">{discount}% off</span>
        )}
      </div>
      <p className="mt-1 text-xs text-ink-500">Inclusive of all taxes · Shipping calculated at checkout</p>
    </div>
  );
}

/**
 * Right-hand purchase column on the product page.
 * Props: `product` (ProductDetail), `purchase` (useProductPurchase result), `onShowReviews()`.
 * The ref points at the CTA row (used by the sticky mobile bar).
 */
export const PurchasePanel = forwardRef(function PurchasePanel({ product, purchase, onShowReviews }, ctaRef) {
  const { status } = purchase;

  return (
    <div>
      {(product.isNewArrival || product.isBestSeller) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {product.isNewArrival && <Badge tone="brand">New</Badge>}
          {product.isBestSeller && <Badge tone="warning">Bestseller</Badge>}
        </div>
      )}
      <h1 className="font-display text-2xl leading-tight font-bold tracking-tight text-balance sm:text-[28px] xl:text-[30px]">{product.name}</h1>
      {product.brand?.name && (
        <p className="mt-2 text-sm text-ink-500">
          Brand:{' '}
          <Link to={`/shop?brand=${encodeURIComponent(product.brand.slug)}`} className="font-semibold text-brand-600 hover:underline">
            {product.brand.name}
          </Link>
        </p>
      )}

      {product.reviewCount > 0 ? (
        <button type="button" onClick={onShowReviews} className="mt-2 flex min-h-9 items-center gap-2 text-sm text-ink-600 hover:text-brand-600">
          <Rating value={product.ratingAverage} size={16} showValue />
          <span className="text-ink-500 hover:text-brand-600">
            ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </button>
      ) : (
        <div className="mt-2 flex min-h-9 items-center gap-2 text-sm text-ink-500">
          <Rating value={0} size={16} />
          No reviews yet
        </div>
      )}

      <div className="mt-4 border-t border-line pt-5">
        <PriceBlock purchase={purchase} />
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <p className={cn('flex items-center gap-1.5 font-semibold', STOCK_TONE[status.tone])} role="status">
            <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
            {status.label}
          </p>
          {purchase.sku && (
            <>
              <span className="hidden h-4 w-px bg-line min-[360px]:block" aria-hidden="true" />
              <p className="min-w-0 text-ink-500">
                SKU: <span className="font-medium break-all text-ink-700">{purchase.sku}</span>
              </p>
            </>
          )}
        </div>
      </div>

      {product.shortDescription && <p className="mt-4 text-sm leading-relaxed text-ink-600">{product.shortDescription}</p>}

      {purchase.variants.length > 1 && (
        <div className="mt-5 border-t border-line pt-5">
          <VariantSelector variants={purchase.variants} selected={purchase.variant} onSelect={purchase.selectVariant} />
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2.5 text-sm font-semibold text-ink-900">Quantity</p>
        <QuantityStepper value={purchase.quantity} onChange={purchase.setQuantity} max={purchase.maxQuantity} disabled={!purchase.canPurchase} />
      </div>

      <div ref={ctaRef} className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          size="lg"
          fullWidth
          className="min-w-0 px-4!"
          onClick={purchase.addToBag}
          loading={purchase.isAdding}
          disabled={!purchase.canPurchase}
          leftIcon={<ShoppingCart size={18} aria-hidden="true" />}
        >
          {status.available ? 'Add to Cart' : 'Out of Stock'}
        </Button>
        <Button
          size="lg"
          variant="outline"
          fullWidth
          className="min-w-0 px-4!"
          onClick={purchase.buyNow}
          loading={purchase.isBuying}
          disabled={!purchase.canPurchase}
          leftIcon={<Zap size={18} aria-hidden="true" />}
        >
          Buy Now
        </Button>
      </div>

      <div className="mt-2">
        <WishlistToggle product={product} variantId={purchase.variantId} />
      </div>

      <TrustRows className="mt-4" />
    </div>
  );
});

export default PurchasePanel;
