import { memo } from 'react';
import { Link } from 'react-router';
import { Heart, ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { Badge, Price, Rating, SmartImage } from '@/components/ui';
import { Spinner } from '@/components/ui/Loader';
import { useCart } from '@/features/cart/useCart';
import { useToggleWishlist, useWishlistIds } from '@/features/wishlist/useWishlist';
import { cn } from '@/utils/cn';

const DEFAULT_SIZES = '(min-width: 1280px) 22vw, (min-width: 1024px) 28vw, (min-width: 640px) 45vw, 48vw';

const productUrl = (product) => `/product/${product.slug}`;

const actionBase =
  'relative z-20 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg px-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 sm:text-sm';

function CardBadges({ product }) {
  return (
    <div className="pointer-events-none absolute top-2 left-2 z-10 flex flex-col items-start gap-1 sm:top-3 sm:left-3">
      {!product.inStock ? (
        <Badge tone="dark">Sold out</Badge>
      ) : (
        <>
          {product.discount > 0 && <Badge tone="solid">-{product.discount}%</Badge>}
          {product.isNewArrival && <Badge tone="success">New</Badge>}
          {product.isBestSeller && <Badge tone="warning">Bestseller</Badge>}
        </>
      )}
    </div>
  );
}

function WishlistButton({ product }) {
  const ids = useWishlistIds();
  const { toggle } = useToggleWishlist();
  const saved = ids.has(product._id);
  return (
    <button
      type="button"
      onClick={() => toggle(product._id, product.defaultVariantId)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      className={cn(
        'absolute top-1 right-1 z-20 flex h-11 w-11 items-center justify-center rounded-full sm:top-2 sm:right-2',
        'before:absolute before:inset-1.5 before:rounded-full before:border before:border-line before:bg-white before:transition-colors hover:before:border-brand-200',
        saved ? 'text-danger-500' : 'text-ink-600 hover:text-danger-500',
      )}
    >
      <Heart size={17} strokeWidth={1.9} className={cn('relative transition-colors', saved && 'fill-danger-500')} />
    </button>
  );
}

function CardAction({ product }) {
  const { addItem, isAdding } = useCart();

  if (!product.inStock) {
    return (
      <button type="button" disabled className={cn(actionBase, 'cursor-not-allowed bg-ink-100 text-ink-400')}>
        Out of Stock
      </button>
    );
  }

  const single = product.variantCount <= 1 && product.defaultVariantId;
  if (!single) {
    return (
      <Link
        to={productUrl(product)}
        className={cn(actionBase, 'border border-brand-500 bg-white text-brand-600 hover:bg-brand-50')}
        aria-label={`View options for ${product.name}`}
      >
        <SlidersHorizontal size={15} aria-hidden="true" className="hidden min-[360px]:block" />
        View Options
      </Link>
    );
  }

  const onAdd = () => addItem({ variantId: product.defaultVariantId, quantity: 1 }).catch(() => {});
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={isAdding}
      aria-label={`Add ${product.name} to cart`}
      className={cn(actionBase, 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:opacity-70')}
    >
      {isAdding ? <Spinner className="h-4 w-4" /> : <ShoppingCart size={16} aria-hidden="true" className="hidden min-[360px]:block" />}
      Add to Cart
    </button>
  );
}

/**
 * Product tile used in every listing.
 * Props: `product` (ProductCard shape), `priority` (eager image), `sizes`, `className`.
 */
function ProductCardBase({ product, priority = false, sizes = DEFAULT_SIZES, className }) {
  const primary = product.thumbnail || product.images?.[0]?.url;
  const soldOut = !product.inStock;

  return (
    <article
      className={cn(
        'group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-white transition-[border-color,box-shadow] duration-300 hover:border-ink-300 hover:shadow-soft',
        className,
      )}
      data-testid="product-card"
    >
      <div className="relative overflow-hidden bg-surface">
        <SmartImage
          src={primary}
          alt={product.images?.[0]?.alt || product.name}
          width={600}
          sizes={sizes}
          aspect="1 / 1"
          priority={priority}
          imgClassName={cn('transition-transform duration-500 ease-out group-hover:scale-[1.04]', soldOut && 'opacity-60 grayscale-[35%]')}
        />
        <CardBadges product={product} />
        <WishlistButton product={product} />
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.brand?.name && (
          <p className="truncate text-[11px] font-semibold tracking-[0.08em] text-ink-500 uppercase">{product.brand.name}</p>
        )}
        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-5 font-medium text-ink-900 sm:text-[15px]">
          <Link to={productUrl(product)} className="after:absolute after:inset-0 after:z-10 after:rounded-xl focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        <div className="mt-1.5 flex h-4 items-center">
          {product.reviewCount > 0 ? (
            <Rating value={product.ratingAverage} count={product.reviewCount} size={12} className="gap-1" />
          ) : (
            <span className="text-xs text-ink-400">No reviews yet</span>
          )}
        </div>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} discount={product.discount} size="md" className="mt-2" />
        <div className="mt-auto pt-3">
          <CardAction product={product} />
        </div>
      </div>
      {/* Keyboard focus ring for the whole-card link. */}
      <span className="pointer-events-none absolute inset-0 z-30 rounded-xl ring-brand-500 group-has-[a:focus-visible]:ring-2" aria-hidden="true" />
    </article>
  );
}

export const ProductCard = memo(ProductCardBase);
export default ProductCard;

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white" aria-hidden="true">
      <div className="skeleton aspect-square w-full rounded-none" />
      <div className="p-3 sm:p-4">
        <div className="skeleton h-2.5 w-16" />
        <div className="skeleton mt-2.5 h-3.5 w-full" />
        <div className="skeleton mt-2 h-3.5 w-2/3" />
        <div className="skeleton mt-3 h-4 w-24" />
        <div className="skeleton mt-4 h-10 w-full" />
      </div>
    </div>
  );
}
