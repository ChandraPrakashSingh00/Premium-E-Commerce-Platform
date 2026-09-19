import { ShoppingBag, X } from 'lucide-react';
import { Link } from 'react-router';
import { Button, Price, Skeleton, SmartImage } from '@/components/ui';

/** Compact wishlist tile for the account area. */
export function SavedItemCard({ item, onMove, onRemove, moving, removing }) {
  const { product } = item;
  const outOfStock = product.inStock === false;
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-line bg-white p-3 transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-soft">
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="block overflow-hidden rounded-xl bg-surface">
          <SmartImage
            src={product.thumbnail || product.images?.[0]?.url}
            alt={product.name}
            width={480}
            aspect="1 / 1"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <button
          type="button"
          onClick={() => onRemove(item)}
          disabled={removing}
          aria-label={`Remove ${product.name} from wishlist`}
          className="absolute top-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-sm backdrop-blur transition-colors hover:text-danger-600 disabled:opacity-50"
        >
          <X size={16} />
        </button>
        {outOfStock && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink-700 shadow-sm">
            Out of stock
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-1 flex-col">
        {product.brand?.name && <p className="text-xs font-medium tracking-wide text-ink-500 uppercase">{product.brand.name}</p>}
        <Link to={`/product/${product.slug}`} className="mt-0.5 line-clamp-2 text-sm font-medium text-ink-900 hover:text-brand-600">
          {product.name}
        </Link>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} discount={product.discount} size="sm" className="mt-1.5" />
        <Button
          variant={outOfStock ? 'secondary' : 'dark'}
          size="sm"
          fullWidth
          className="mt-3"
          leftIcon={<ShoppingBag size={15} />}
          disabled={outOfStock}
          loading={moving}
          onClick={() => onMove(item)}
        >
          {outOfStock ? 'Unavailable' : 'Move to bag'}
        </Button>
      </div>
    </article>
  );
}

export function SavedItemSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="mt-3 h-3 w-16" />
      <Skeleton className="mt-2 h-4 w-3/4" />
      <Skeleton className="mt-3 h-9 w-full" />
    </div>
  );
}
