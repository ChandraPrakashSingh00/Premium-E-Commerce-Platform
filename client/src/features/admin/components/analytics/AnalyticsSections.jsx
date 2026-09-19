import { Download, IndianRupee, Package, Receipt, RotateCcw, ShoppingBag, UserPlus } from 'lucide-react';
import { Button, Card, CardHeader } from '@/components/ui';
import { formatNumber, formatPrice } from '@/utils/format';
import { ChartSkeleton, CountBarChart, CHART, PaymentMethodDonut, RevenueChart } from '../charts';
import { DataTable } from '../DataTable';
import { StatCard } from '../StatCard';
import { exportTopTable, TOP_TABLES } from './analyticsExport';

export function AnalyticsSummary({ summary, loading }) {
  const s = summary ?? {};
  const tiles = [
    { label: 'Revenue', icon: IndianRupee, tone: 'brand', value: formatPrice(s.revenue ?? 0), hint: 'Net of processed refunds' },
    { label: 'Orders', icon: ShoppingBag, value: formatNumber(s.orders), hint: 'All orders placed' },
    { label: 'Avg. order value', icon: Receipt, value: formatPrice(s.avgOrderValue ?? 0), hint: 'Revenue ÷ paid orders' },
    { label: 'New customers', icon: UserPlus, value: formatNumber(s.newCustomers), hint: 'Accounts created' },
    { label: 'Refunded', icon: RotateCcw, value: formatPrice(s.refunded ?? 0), hint: 'Processed refunds' },
    { label: 'Items sold', icon: Package, value: formatNumber(s.itemsSold), hint: 'Units in paid orders' },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
      {tiles.map((t) => (
        <StatCard key={t.label} loading={loading} {...t} />
      ))}
    </div>
  );
}

export function SeriesCharts({ series = [], granularity, loading }) {
  return (
    <>
      <Card>
        <CardHeader title="Revenue" description={`Per ${granularity}`} />
        {loading ? <ChartSkeleton height={300} /> : <RevenueChart data={series} granularity={granularity} height={300} />}
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader title="Orders" description={`Orders placed per ${granularity}`} />
          {loading ? (
            <ChartSkeleton height={240} />
          ) : (
            <CountBarChart data={series} dataKey="orders" label="Orders" color={CHART.primary} granularity={granularity} height={240} />
          )}
        </Card>
        <Card>
          <CardHeader title="New customers" description={`Sign-ups per ${granularity}`} />
          {loading ? (
            <ChartSkeleton height={240} />
          ) : (
            <CountBarChart data={series} dataKey="customers" label="New customers" color={CHART.primary} granularity={granularity} height={240} />
          )}
        </Card>
      </div>
    </>
  );
}

export function PaymentMethodsCard({ items, loading }) {
  return (
    <Card>
      <CardHeader title="Payment methods" description="Share of orders placed" />
      {loading ? <ChartSkeleton height={200} /> : <PaymentMethodDonut items={items} />}
    </Card>
  );
}

function TopTable({ table, rows = [], loading, error, onRetry, period }) {
  const total = rows.reduce((sum, r) => sum + (r.revenue || 0), 0);
  const columns = [
    {
      key: 'name',
      header: table.nameHeader,
      cell: (r) => (
        <span className="flex items-center gap-2.5">
          <span className="w-4 text-xs text-ink-400 tabular-nums">{rows.indexOf(r) + 1}</span>
          <span className="truncate font-medium text-ink-900">{r.name ?? 'Unknown'}</span>
        </span>
      ),
    },
    { key: 'quantity', header: 'Units', align: 'right', cell: (r) => <span className="tabular-nums">{formatNumber(r.quantity)}</span> },
    { key: 'revenue', header: 'Revenue', align: 'right', cell: (r) => <span className="font-semibold text-ink-900 tabular-nums">{formatPrice(r.revenue)}</span> },
    {
      key: 'share',
      header: 'Share',
      align: 'right',
      hideBelow: 'sm',
      cell: (r) => <span className="text-ink-500 tabular-nums">{total ? `${((r.revenue / total) * 100).toFixed(1)}%` : '—'}</span>,
    },
  ];
  return (
    <section aria-labelledby={`${table.key}-title`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id={`${table.key}-title`} className="text-base font-semibold text-ink-900">
          {table.title}
        </h2>
        <Button variant="ghost" size="sm" leftIcon={<Download size={15} />} disabled={!rows.length || !period} onClick={() => exportTopTable(table, rows, period)}>
          CSV
        </Button>
      </div>
      <DataTable
        dense
        caption={`${table.title} by revenue`}
        columns={columns}
        rows={rows}
        rowKey={(r) => r[table.idKey] ?? r.name}
        loading={loading}
        error={error}
        onRetry={onRetry}
        skeletonRows={5}
        minWidth={0}
        empty={{ title: 'No sales in this period', description: 'Try a wider date range.' }}
      />
    </section>
  );
}

export function TopTables({ data, loading, period }) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 [&>*]:min-w-0">
      {TOP_TABLES.map((t) => (
        <TopTable key={t.key} table={t} rows={data?.[t.key]} loading={loading} period={period} />
      ))}
    </div>
  );
}
