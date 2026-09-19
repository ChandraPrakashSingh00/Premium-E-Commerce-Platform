import { useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ErrorState, IconButton } from '@/components/ui';
import { PageHeader } from '@/features/admin/components';
import { Segmented } from '@/features/admin/components/charts';
import {
  AttentionStats,
  CustomersCard,
  DashboardStats,
  RecentOrdersCard,
  SalesCard,
  StatusCard,
  TopCategoriesCard,
  TopProductsCard,
} from '@/features/admin/components/dashboard/DashboardSections';
import { useDashboard } from '@/features/admin/hooks/useDashboard';
import { useListParams } from '@/features/admin/hooks/shared';
import { formatDate } from '@/utils/format';

const RANGES = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '12m', label: '12M' },
];
const RANGE_LABELS = { '7d': 'last 7 days', '30d': 'last 30 days', '90d': 'last 90 days', '12m': 'last 12 months' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const { params, setParam } = useListParams({ range: '30d' });
  const range = RANGES.some((r) => r.value === params.range) ? params.range : '30d';
  const { data, isPending, isFetching, error, refetch } = useDashboard(range);
  const openOrder = useCallback((o) => navigate(`/admin/orders/${o._id}`), [navigate]);

  const granularity = data?.period?.granularity ?? (range === '12m' ? 'month' : 'day');
  const loading = isPending;
  const periodLabel = data?.period ? `${formatDate(data.period.from)} – ${formatDate(data.period.to)}` : RANGE_LABELS[range];
  const totals = data && { revenue: data.cards?.revenue?.value, orders: data.cards?.orders?.value };

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Welcome back! Here's your store for the ${RANGE_LABELS[range]} (${periodLabel}), compared with the previous period.`}
        actions={
          <>
            <IconButton label="Refresh" size="iconSm" variant="ghost" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={16} className={isFetching ? 'animate-spin' : undefined} />
            </IconButton>
            <Segmented label="Date range" size="md" options={RANGES} value={range} onChange={(v) => setParam('range', v === '30d' ? '' : v)} />
          </>
        }
      />

      {error && !data ? (
        <div className="rounded-xl border border-line bg-white">
          <ErrorState error={error} onRetry={refetch} title="Could not load the dashboard" />
        </div>
      ) : (
        <div className="space-y-6">
          <DashboardStats cards={data?.cards} loading={loading} />
          <AttentionStats cards={data?.cards} loading={loading} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
            <SalesCard series={data?.revenueSeries} granularity={granularity} loading={loading} total={totals} />
            <StatusCard items={data?.orderStatusBreakdown} loading={loading} />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-5 [&>*]:min-w-0">
            <TopProductsCard items={data?.topProducts} loading={loading} className="xl:col-span-2" />
            <RecentOrdersCard orders={data?.recentOrders} loading={loading} onOpen={openOrder} className="xl:col-span-3" />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&>*]:min-w-0">
            <CustomersCard series={data?.customerSeries} granularity={granularity} loading={loading} />
            <TopCategoriesCard items={data?.topCategories} loading={loading} />
          </div>
        </div>
      )}
    </>
  );
}
