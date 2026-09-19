import { Fragment } from 'react';
import { Link } from 'react-router';
import { Plus, ShoppingCart } from 'lucide-react';
import { Button, Price, Rating, SmartImage } from '@/components/ui';
import { useCart } from '@/features/cart/useCart';
import { useFrequentlyBought } from '@/features/products/hooks';

function BundleItem({ product, current = false }) {
  const { addItem, isAdding } = useCart();
  const single = product.variantCount <= 1 && product.defaultVariantId;
  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-line bg-white p-3 transition hover:border-brand-200 hover:shadow-soft">
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden rounded-lg" tabIndex={current ? -1 : undefined}>
        <SmartImage src={product.thumbnail} alt={product.name} width={300} sizes="200px" aspect="1 / 1" />
        {current && <span className="absolute top-2 left-2 rounded-md bg-brand-500 px-2 py-0.5 text-[11px] font-semibold text-white">This item</span>}
      </Link>
      <div className="mt-3 flex min-w-0 flex-1 flex-col">
        <Link to={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium text-ink-900 hover:text-brand-600">
          {product.name}
        </Link>
        {product.reviewCount > 0 && <Rating value={product.ratingAverage} count={product.reviewCount} size={12} className="mt-1" />}
        <Price price={product.price} compareAtPrice={product.compareAtPrice} discount={product.discount} size="sm" className="mt-1.5" />
        {!current && (
          <div className="mt-auto pt-3">
            {!product.inStock ? (
              <p className="flex h-9 items-center text-xs font-semibold text-danger-600">Out of stock</p>
            ) : single ? (
              <Button
                size="sm"
                fullWidth
                loading={isAdding}
                onClick={() => addItem({ variantId: product.defaultVariantId, quantity: 1 }).catch(() => {})}
                leftIcon={<ShoppingCart size={14} aria-hidden="true" />}
              >
                Add to Cart
              </Button>
            ) : (
              <Button size="sm" variant="outline" fullWidth to={`/product/${product.slug}`}>
                View Options
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** "Frequently Bought Together" row. Props: `product` (the current ProductDetail). */
export function FrequentlyBought({ product }) {
  const { data = [] } = useFrequentlyBought(product.slug);
  const items = data.filter((p) => p._id !== product._id).slice(0, 3);
  if (!items.length) return null;
  const current = {
    ...product,
    thumbnail: product.thumbnail || product.images?.[0]?.url,
  };

  return (
    <section aria-labelledby="fbt-heading" className="rounded-2xl border border-line bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="fbt-heading" className="font-display text-xl font-semibold sm:text-2xl">
            Frequently Bought Together
          </h2>
          <p className="mt-1 text-sm text-ink-500">Customers who bought this also added these to their cart.</p>
        </div>
      </div>
      <ul className="scrollbar-none relative -mx-4 mt-5 flex snap-x items-stretch gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {[current, ...items].map((p, i) => (
          <Fragment key={p._id}>
            {i > 0 && (
              <li aria-hidden="true" className="flex shrink-0 items-center">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                  <Plus size={16} strokeWidth={2.25} />
                </span>
              </li>
            )}
            <li className="flex w-40 shrink-0 snap-start sm:w-47.5 lg:w-auto lg:max-w-57.5 lg:flex-1">
              <BundleItem product={p} current={i === 0} />
            </li>
          </Fragment>
        ))}
      </ul>
    </section>
  );
}

export default FrequentlyBought;
