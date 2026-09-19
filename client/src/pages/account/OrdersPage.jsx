import { Package } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, EmptyState, ErrorState, Pagination, Tabs } from '@/components/ui';
import { AccountPageHeader } from '@/features/account/components/AccountBits';
import { OrderCard, OrderCardSkeleton } from '@/features/orders/components';
import { useOrders } from '@/features/orders/hooks';
import { cn } from '@/utils/cn';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
];

const PAGE_SIZE = 10;

export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const statusParam = params.get('status');
  const status = FILTERS.some((f) => f.value === statusParam) ? statusParam : 'all';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const query = { page, limit: PAGE_SIZE, ...(status !== 'all' && { status }) };
  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useOrders(query);
  const orders = data?.items ?? [];
  const pagination = data?.pagination;

  const update = (next) => {
    const merged = { status, page, ...next };
    const search = new URLSearchParams();
    if (merged.status !== 'all') search.set('status', merged.status);
    if (merged.page > 1) search.set('page', String(merged.page));
    setParams(search, { replace: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeLabel = FILTERS.find((f) => f.value === status)?.label.toLowerCase();

  return (
    <>
      <Seo title="My orders" noindex />
      <AccountPageHeader title="My Orders" description="Track, return or buy again." />

      <div className="mb-4 rounded-2xl border border-line bg-white px-2 sm:px-4">
        <Tabs tabs={FILTERS} value={status} onChange={(value) => update({ status: value, page: 1 })} className="border-b-0!" />
      </div>

      <div role="tabpanel" id={`panel-${status}`} aria-labelledby={`tab-${status}`} aria-busy={isLoading || isPlaceholderData}>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={refetch} compact className="card" />
        ) : orders.length === 0 ? (
          <EmptyState
            className="card"
            icon={<Package size={28} strokeWidth={1.5} />}
            title={status === 'all' ? 'No orders yet' : `No ${activeLabel} orders`}
            description={
              status === 'all' ? 'Your orders will appear here once you check out.' : 'Try a different filter to see your other orders.'
            }
            action={
              status === 'all' ? (
                <Button to="/shop">Start Shopping</Button>
              ) : (
                <Button variant="outline" onClick={() => update({ status: 'all', page: 1 })}>
                  View All Orders
                </Button>
              )
            }
          />
        ) : (
          <>
            <ul className={cn('space-y-3 transition-opacity', isPlaceholderData && 'opacity-60')}>
              {orders.map((order) => (
                <li key={order._id}>
                  <OrderCard order={order} />
                </li>
              ))}
            </ul>
            <Pagination
              className="mt-8"
              page={pagination?.page ?? page}
              totalPages={pagination?.totalPages}
              onChange={(p) => update({ page: p })}
            />
          </>
        )}
      </div>
    </>
  );
}
