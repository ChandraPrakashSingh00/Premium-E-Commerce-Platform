import { Heart } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { Button, EmptyState, ErrorState } from '@/components/ui';
import { AccountPageHeader } from '@/features/account/components/AccountBits';
import { SavedItemCard, SavedItemSkeleton } from '@/features/account/components/SavedItemCard';
import { useMoveToCart, useToggleWishlist, useWishlist } from '@/features/wishlist/useWishlist';
import { pluralize } from '@/utils/format';

export default function AccountWishlistPage() {
  const { data, isLoading, isError, error, refetch } = useWishlist();
  const move = useMoveToCart();
  const wishlist = useToggleWishlist();
  const items = (data?.items ?? []).filter((i) => i.product);

  return (
    <>
      <Seo title="Wishlist" noindex />
      <AccountPageHeader
        title="Wishlist"
        description={items.length ? `${pluralize(items.length, 'saved item')}` : 'Everything you have saved, in one place.'}
        action={items.length ? <Button variant="secondary" to="/wishlist">Open full wishlist</Button> : null}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 *:min-w-0">
          {Array.from({ length: 4 }, (_, i) => (
            <SavedItemSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} compact className="card" />
      ) : items.length === 0 ? (
        <EmptyState
          className="card"
          icon={<Heart size={28} strokeWidth={1.5} />}
          title="Nothing saved yet"
          description="Tap the heart on any product to keep it here for later."
          action={<Button to="/shop">Discover new arrivals</Button>}
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 *:min-w-0">
          {items.map((item) => (
            <li key={item.product._id}>
              <SavedItemCard
                item={item}
                moving={move.isPending && move.variables?.productId === item.product._id}
                removing={wishlist.isPending}
                onMove={(i) => move.mutate({ productId: i.product._id, variantId: i.variantId ?? i.product.defaultVariantId })}
                onRemove={(i) => wishlist.toggle(i.product._id)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
