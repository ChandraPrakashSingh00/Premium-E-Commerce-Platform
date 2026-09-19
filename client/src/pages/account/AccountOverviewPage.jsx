import { ArrowRight, Heart, MapPin, Package, Settings, ShoppingBag, Star, Truck, User, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, EmptyState, ErrorState } from '@/components/ui';
import { StatCard } from '@/features/account/components/AccountBits';
import { useAccountStats } from '@/features/account/hooks';
import { OrderCard, OrderCardSkeleton } from '@/features/orders/components';
import { useOrders } from '@/features/orders/hooks';
import { formatNumber, formatPrice } from '@/utils/format';

const QUICK_LINKS = [
  { to: '/account/profile', label: 'Profile & security', description: 'Name, phone and password', icon: User },
  { to: '/account/addresses', label: 'Address book', description: 'Manage delivery addresses', icon: MapPin },
  { to: '/account/wishlist', label: 'Saved items', description: 'Pieces you love', icon: Heart },
  { to: '/account/reviews', label: 'My reviews', description: 'Share your thoughts', icon: Star },
  { to: '/account/settings', label: 'Preferences', description: 'Emails and sessions', icon: Settings },
];

function RecentOrders() {
  const { data, isLoading, isError, error, refetch } = useOrders({ page: 1, limit: 3 });
  const orders = data?.items ?? [];

  return (
    <section aria-labelledby="recent-orders">
      <div className="mb-4 flex items-center justify-between">
        <h2 id="recent-orders" className="font-display text-lg font-semibold">
          Recent Orders
        </h2>
        {orders.length > 0 && (
          <Link to="/account/orders" className="link inline-flex items-center gap-1 text-sm">
            View All <ArrowRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3">
          <OrderCardSkeleton />
          <OrderCardSkeleton />
        </div>
      ) : isError ? (
        <ErrorState compact error={error} onRetry={refetch} className="card" />
      ) : orders.length === 0 ? (
        <EmptyState
          compact
          className="card"
          icon={<ShoppingBag size={28} strokeWidth={1.5} />}
          title="No orders yet"
          description="When you place an order, you can track it here."
          action={<Button to="/shop">Start Shopping</Button>}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function AccountOverviewPage() {
  const { data: stats, isLoading, isError, refetch } = useAccountStats();
  const value = (v, fmt = formatNumber) => (isError ? '—' : fmt(v ?? 0));

  return (
    <>
      <Seo title="My account" noindex />
      <h1 className="sr-only">Account overview</h1>

      <section aria-label="Account summary" className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 xl:grid-cols-4 *:min-w-0">
        <StatCard label="Orders" value={value(stats?.orderCount)} icon={Package} to="/account/orders" loading={isLoading} />
        <StatCard label="In progress" value={value(stats?.activeOrders)} icon={Truck} to="/account/orders" loading={isLoading} />
        <StatCard label="Total spent" value={value(stats?.totalSpent, formatPrice)} icon={Wallet} loading={isLoading} />
        <StatCard label="Wishlist" value={value(stats?.wishlistCount)} icon={Heart} to="/account/wishlist" loading={isLoading} />
      </section>
      {isError && (
        <p className="mt-3 text-sm text-ink-500">
          We could not load your stats.{' '}
          <button type="button" className="link" onClick={() => refetch()}>
            Retry
          </button>
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px] *:min-w-0">
        <RecentOrders />

        <section aria-labelledby="quick-links">
          <h2 id="quick-links" className="mb-4 font-display text-lg font-semibold">
            Quick Links
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {QUICK_LINKS.map(({ to, label, description, icon: Icon }) => (
              <li key={to}>
                <Link to={to} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-brand-50/50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 group-hover:bg-brand-500 group-hover:text-white">
                    <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-ink-900">{label}</span>
                    <span className="block text-xs text-ink-500">{description}</span>
                  </span>
                  <ArrowRight size={16} className="text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
