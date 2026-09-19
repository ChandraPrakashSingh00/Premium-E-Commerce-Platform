import { memo } from 'react';
import { Link } from 'react-router';
import { ShoppingCart, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Badge, Button, Price, SmartImage } from '@/components/ui';
import { stockStatus } from '@/features/products/hooks';
import { needsVariantChoice } from '@/features/wishlist/useMoveWishlistItem';
import { cn } from '@/utils/cn';

/**
 * Wishlist tile. Props: `entry` ({ product, variantId }), `onMove(entry)`, `onRemove(productId)`, `moving`.
 */
function WishlistItemBase({ entry, onMove, onRemove, moving }) {
  const { product } = entry;
  const status = stockStatus(product.stock, product.inStock);
  const chooseOptions = needsVariantChoice(entry);

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-white transition-[border-color,box-shadow] duration-300 hover:border-ink-300 hover:shadow-soft">
      <div className="relative bg-surface">
        <Link to={`/product/${product.slug}`} className="block" tabIndex={-1} aria-hidden="true">
          <SmartImage
            src={product.thumbnail}
            alt=""
            width={600}
            sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw"
            aspect="1 / 1"
            imgClassName={cn('transition-transform duration-500 group-hover:scale-[1.04]', !status.available && 'opacity-60 grayscale-[35%]')}
          />
        </Link>
        {product.discount > 0 && status.available && (
          <Badge tone="solid" className="absolute top-2 left-2 sm:top-3 sm:left-3">
            -{product.discount}%
          </Badge>
        )}
        <button
          type="button"
          onClick={() => onRemove(product._id)}
          className="absolute top-1 right-1 flex h-11 w-11 items-center justify-center rounded-full text-ink-600 before:absolute before:inset-1.5 before:rounded-full before:border before:border-line before:bg-white hover:text-danger-600 sm:top-2 sm:right-2"
          aria-label={`Remove ${product.name} from wishlist`}
        >
          <Trash2 size={16} className="relative" />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.brand?.name && <p className="truncate text-[11px] font-semibold tracking-[0.08em] text-ink-500 uppercase">{product.brand.name}</p>}
        <h3 className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm leading-5 font-medium">
          <Link to={`/product/${product.slug}`} className="hover:text-brand-600">
            {product.name}
          </Link>
        </h3>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} discount={product.discount} className="mt-2" />
        <p className={cn('mt-1 text-xs font-medium', status.tone === 'success' ? 'text-success-600' : status.available ? 'text-warning-600' : 'text-danger-600')}>
          {status.label}
        </p>
        <div className="mt-auto pt-3">
          {!status.available ? (
            <Button variant="secondary" fullWidth disabled className="px-2!">
              Out of Stock
            </Button>
          ) : chooseOptions ? (
            <Button variant="outline" fullWidth className="px-2!" to={`/product/${product.slug}`} leftIcon={<SlidersHorizontal size={15} className="hidden min-[360px]:block" />}>
              View Options
            </Button>
          ) : (
            <Button fullWidth className="px-2!" loading={moving} onClick={() => onMove(entry)} leftIcon={<ShoppingCart size={15} className="hidden min-[360px]:block" />}>
              Move to Cart
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export const WishlistItem = memo(WishlistItemBase);
export default WishlistItem;
