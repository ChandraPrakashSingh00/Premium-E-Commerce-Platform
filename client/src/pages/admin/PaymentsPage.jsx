import { useCallback, useState } from 'react';
import { AlertTriangle, CreditCard, RotateCcw, Wallet } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui';
import { DataTable, FilterBar, PageHeader, StatCard, StatusBadge } from '@/features/admin/components';
import { PaymentDetailDrawer } from '@/features/admin/components/payments/PaymentDetailDrawer';
import { useAdminPayments } from '@/features/admin/hooks/usePayments';
import { useListParams } from '@/features/admin/hooks/shared';
import { formatDateTime, formatNumber, formatPrice } from '@/utils/format';

const LIMIT = 20;
const STATUS_OPTIONS = [
  { value: 'created', label: 'Created' },
  { value: 'authorized', label: 'Authorized' },
  { value: 'captured', label: 'Captured' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'partially_refunded', label: 'Partially refunded' },
];
const METHOD_SHORT = { razorpay: 'Razorpay', cod: 'COD' };
const METHOD_OPTIONS = Object.entries(METHOD_SHORT).map(([value, label]) => ({ value, label }));

const COLUMNS = [
  {
    key: 'order',
    header: 'Order',
    cell: (p) =>
      p.order?._id ? (
        <Link to={`/admin/orders/${p.order._id}`} className="font-semibold whitespace-nowrap text-ink-900 hover:text-brand-600">
          {p.order.orderNumber}
        </Link>
      ) : null,
  },
  {
    key: 'customer',
    header: 'Customer',
    cell: (p) => (
      <div className="max-w-55 min-w-0">
        <p className="truncate font-medium text-ink-900">{p.user?.name || '—'}</p>
        <p className="truncate text-xs text-ink-500">{p.user?.email}</p>
      </div>
    ),
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cell: (p) => (
      <div className="whitespace-nowrap">
        <p className="font-semibold text-ink-900 tabular-nums">{formatPrice(p.amount)}</p>
        {p.amountRefunded > 0 && <p className="text-xs text-ink-500 tabular-nums">−{formatPrice(p.amountRefunded)} refunded</p>}
      </div>
    ),
  },
  { key: 'method', header: 'Method', hideBelow: 'sm', cell: (p) => METHOD_SHORT[p.method] ?? p.method },
  { key: 'status', header: 'Status', cell: (p) => <StatusBadge type="paymentRecord" value={p.status} /> },
  {
    key: 'razorpayPaymentId',
    header: 'Razorpay ID',
    hideBelow: 'lg',
    cell: (p) =>
      p.razorpayPaymentId ? (
        <span className="block max-w-40 truncate font-mono text-xs text-ink-600" title={p.razorpayPaymentId}>
          {p.razorpayPaymentId}
        </span>
      ) : (
        <span className="text-ink-300">—</span>
      ),
  },
  {
    key: 'createdAt',
    header: 'Date',
    hideBelow: 'md',
    cell: (p) => <span className="whitespace-nowrap text-ink-600 tabular-nums">{formatDateTime(p.createdAt)}</span>,
  },
];

export default function PaymentsPage() {
  const { params, setParam, setParams, reset, activeCount } = useListParams({ limit: LIMIT });
  const query = useAdminPayments(params);
  const { items = [], pagination, meta } = query.data ?? {};
  const [selected, setSelected] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const onSearch = useCallback((value) => setParam('q', value), [setParam]);
  const filtered = activeCount > 0;
  const statsLoading = query.isPending;
  const hint = filtered ? 'For the current filters' : 'All time';

  const openPayment = (row) => {
    setSelected(row._id);
    setDrawerOpen(true);
  };

  return (
    <>
      <PageHeader title="Payments" description="Gateway transactions, cash on delivery collections and refunds." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 [&>*]:min-w-0">
        <StatCard label="Captured" icon={Wallet} tone="brand" loading={statsLoading} value={formatPrice(meta?.capturedAmount)} hint={hint} />
        <StatCard label="Refunded" icon={RotateCcw} loading={statsLoading} value={formatPrice(meta?.refundedAmount)} hint={hint} />
        <StatCard
          label="Failed payments"
          icon={AlertTriangle}
          tone={meta?.failedCount > 0 ? 'danger' : 'neutral'}
          loading={statsLoading}
          value={formatNumber(meta?.failedCount)}
          hint={hint}
        />
      </div>

      <FilterBar
        search={{ value: params.q ?? '', onChange: onSearch, placeholder: 'Order no. or Razorpay ID' }}
        filters={[
          { key: 'status', label: 'Status', options: STATUS_OPTIONS, value: params.status ?? '', onChange: (v) => setParam('status', v) },
          { key: 'method', label: 'Method', allText: 'All Methods', options: METHOD_OPTIONS, value: params.method ?? '', onChange: (v) => setParam('method', v) },
        ]}
        dateRange={{ from: params.from ?? '', to: params.to ?? '', onChange: ({ from, to }) => setParams({ from, to }) }}
        onReset={() => reset()}
        activeCount={activeCount}
      />

      <DataTable
        caption="Payments"
        columns={COLUMNS}
        rows={items}
        loading={query.isPending}
        fetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        onRowClick={openPayment}
        rowLabel={(p) => `View payment for order ${p.order?.orderNumber ?? ''}`}
        pagination={pagination}
        onPageChange={(page) => setParam('page', page)}
        empty={
          filtered
            ? {
                title: 'No payments match these filters',
                description: 'Try a different search or clear the filters.',
                action: (
                  <Button variant="secondary" size="sm" onClick={() => reset()}>
                    Clear filters
                  </Button>
                ),
              }
            : {
                icon: <CreditCard size={28} strokeWidth={1.5} />,
                title: 'No payments yet',
                description: 'Payments are recorded when customers check out.',
              }
        }
      />

      <PaymentDetailDrawer open={drawerOpen} paymentId={selected} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
