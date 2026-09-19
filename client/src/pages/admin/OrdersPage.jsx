import { useCallback } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button, Tabs } from '@/components/ui';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/constants';
import { DataTable, FilterBar, PageHeader, StatusBadge } from '@/features/admin/components';
import { useAdminOrders } from '@/features/admin/hooks/useOrders';
import { useListParams } from '@/features/admin/hooks/shared';
import { formatDate, formatPrice, pluralize } from '@/utils/format';

const LIMIT = 20;
const formatTime = (value) => (value ? new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value)) : '');
const toOptions = (labels) => Object.entries(labels).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = toOptions(ORDER_STATUS_LABELS);
const PAYMENT_STATUS_OPTIONS = toOptions(PAYMENT_STATUS_LABELS);
const METHOD_SHORT = { razorpay: 'Razorpay', cod: 'COD' };
const METHOD_OPTIONS = toOptions(METHOD_SHORT);
const QUICK_TABS = [
  { value: '', label: 'All' },
  ...['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((value) => ({ value, label: ORDER_STATUS_LABELS[value] })),
];

const COLUMNS = [
  {
    key: 'orderNumber',
    header: 'Order ID',
    cell: (o) => (
      <Link to={`/admin/orders/${o._id}`} className="font-semibold whitespace-nowrap text-ink-900 hover:text-brand-600">
        {o.orderNumber}
      </Link>
    ),
  },
  {
    key: 'customer',
    header: 'Customer',
    cell: (o) => {
      const c = o.customer ?? o.contact ?? {};
      return (
        <div className="max-w-55 min-w-0">
          <p className="truncate font-medium text-ink-900">{c.name || '—'}</p>
          <p className="truncate text-xs text-ink-500">{c.email}</p>
        </div>
      );
    },
  },
  {
    key: 'items',
    header: 'Items',
    align: 'center',
    hideBelow: 'lg',
    cell: (o) => <span className="tabular-nums">{o.itemCount ?? o.items?.length ?? 0}</span>,
  },
  {
    key: 'total',
    header: 'Amount',
    align: 'right',
    cell: (o) => <span className="font-semibold whitespace-nowrap text-ink-900 tabular-nums">{formatPrice(o.pricing?.total)}</span>,
  },
  { key: 'status', header: 'Status', cell: (o) => <StatusBadge type="order" value={o.status} /> },
  {
    key: 'payment',
    header: 'Payment',
    cell: (o) => (
      <div className="flex flex-col items-start gap-1">
        <StatusBadge type="payment" value={o.paymentStatus} />
        <span className="text-xs text-ink-500">{METHOD_SHORT[o.paymentMethod] ?? o.paymentMethod}</span>
      </div>
    ),
  },
  {
    key: 'createdAt',
    header: 'Date',
    cell: (o) => (
      <div className="whitespace-nowrap tabular-nums">
        <p className="text-ink-700">{formatDate(o.createdAt)}</p>
        <p className="text-xs text-ink-400">{formatTime(o.createdAt)}</p>
      </div>
    ),
  },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const { params, setParam, setParams, reset, activeCount } = useListParams({ limit: LIMIT });
  const query = useAdminOrders(params);
  const { items = [], pagination } = query.data ?? {};

  const onSearch = useCallback((value) => setParam('q', value), [setParam]);
  const filter = (key, label, options) => ({ key, label, options, value: params[key] ?? '', onChange: (v) => setParam(key, v) });

  const filtered = activeCount > 0;

  return (
    <>
      <PageHeader
        title="Orders"
        description={pagination ? `${pluralize(pagination.total, 'order')}${filtered ? ' match your filters' : ''}` : 'Track, fulfil and refund customer orders.'}
      />

      <Tabs tabs={QUICK_TABS} value={params.status ?? ''} onChange={(value) => setParam('status', value)} className="mb-4" />

      <FilterBar
        search={{ value: params.q ?? '', onChange: onSearch, placeholder: 'Search by order ID, name, email or phone', label: 'Search orders' }}
        filters={[
          filter('status', 'Status', STATUS_OPTIONS),
          filter('paymentStatus', 'Payment', PAYMENT_STATUS_OPTIONS),
          { ...filter('paymentMethod', 'Method', METHOD_OPTIONS), allText: 'All Methods' },
        ]}
        dateRange={{ from: params.from ?? '', to: params.to ?? '', onChange: ({ from, to }) => setParams({ from, to }) }}
        onReset={() => reset()}
        activeCount={activeCount}
      />

      <DataTable
        caption="Orders"
        minWidth={760}
        columns={COLUMNS}
        rows={items}
        loading={query.isPending}
        fetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        onRowClick={(o) => navigate(`/admin/orders/${o._id}`)}
        rowLabel={(o) => `Open order ${o.orderNumber}`}
        pagination={pagination}
        onPageChange={(page) => setParam('page', page)}
        empty={
          filtered
            ? {
                title: 'No orders match these filters',
                description: 'Try a different search or clear the filters.',
                action: (
                  <Button variant="secondary" size="sm" onClick={() => reset()}>
                    Clear filters
                  </Button>
                ),
              }
            : {
                icon: <ShoppingBag size={28} strokeWidth={1.5} />,
                title: 'No orders yet',
                description: 'Orders appear here as soon as customers check out.',
              }
        }
      />
    </>
  );
}
