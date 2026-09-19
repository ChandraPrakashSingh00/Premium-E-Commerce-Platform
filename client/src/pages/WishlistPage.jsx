import { useLocation } from 'react-router';
import { Heart, UserRound } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { ListingHeader } from '@/components/product/ListingHeader';
import { ProductCardSkeleton } from '@/components/product/ProductCard';
import { WishlistItem } from '@/components/product/WishlistItem';
import { Button, EmptyState, ErrorState } from '@/components/ui';
import { useMoveWishlistItem } from '@/features/wishlist/useMoveWishlistItem';
import { useToggleWishlist, useWishlist } from '@/features/wishlist/useWishlist';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';

const GRID = 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:gap-5 xl:grid-cols-4 [&>*]:min-w-0';

function GuestBanner() {
  const { pathname } = useLocation();
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-xl border border-brand-100 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-500" aria-hidden="true">
          <UserRound size={20} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">Your wishlist is saved on this device</p>
          <p className="mt-0.5 text-sm text-ink-500">Sign in to sync it across devices and get alerts when prices drop.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button to={`/login?redirect=${encodeURIComponent(pathname)}`} className="flex-1 sm:flex-none">
          Sign in
        </Button>
        <Button to="/register" variant="outline" className="flex-1 sm:flex-none">
          Create account
        </Button>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const authStatus = useAuthStore((s) => s.status);
  const { data, isPending, isError, error, refetch } = useWishlist();
  const { toggle } = useToggleWishlist();
  const { move, pendingId } = useMoveWishlistItem();
  const items = data?.items ?? [];
  const loading = isPending || authStatus === 'idle' || authStatus === 'loading';

  let content;
  if (loading) {
    content = (
      <div className={GRID} aria-busy="true">
        {Array.from({ length: 4 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  } else if (isError) {
    content = <ErrorState error={error} onRetry={refetch} className="rounded-2xl border border-line bg-white" />;
  } else if (!items.length) {
    content = (
      <EmptyState
        className="rounded-2xl border border-line bg-white px-4"
        icon={<Heart size={28} strokeWidth={1.5} />}
        title="Your wishlist is empty"
        description="Tap the heart on any product to save it here for later."
        action={<Button to="/shop">Discover products</Button>}
      />
    );
  } else {
    content = (
      <ul className={GRID}>
        {items.map((entry) => (
          <li key={entry.product._id}>
            <WishlistItem entry={entry} onMove={move} onRemove={toggle} moving={pendingId === entry.product._id} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="min-h-[60vh] bg-surface">
      <div className="container-page pb-12 sm:pb-16">
        <Seo title="My Wishlist" noindex />
        <ListingHeader
          title="My Wishlist"
          description={items.length ? `${items.length} saved ${items.length === 1 ? 'item' : 'items'}` : undefined}
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Wishlist' }]}
        />
        {!isAuthenticated && !loading && <GuestBanner />}
        {content}
      </div>
    </div>
  );
}
