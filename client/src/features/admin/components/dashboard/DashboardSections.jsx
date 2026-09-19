import { useState } from 'react';
import { AlertTriangle, ArrowRight, Clock, IndianRupee, Package, ShoppingBag, Users } from 'lucide-react';
import { Link } from 'react-router';
import { Card, CardHeader, SmartImage } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatDate, formatNumber, formatPrice } from '@/utils/format';
import { ChartSkeleton, CustomersChart, OrdersBarChart, OrderStatusDonut, RevenueChart, Segmented, TopList } from '../charts';
import { DataTable } from '../DataTable';
import { StatCard } from '../StatCard';
import { StatusBadge } from '../StatusBadge';

/** Four headline KPIs (board row 1). `cards` = dashboard.cards */
export function DashboardStats({ cards, loading }) {
  const c = cards ?? {};
  const customersTotal = c.customers?.total;
  return (
    <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4 [&>*]:min-w-0">
      <StatCard
        label="Total Revenue"
        icon={IndianRupee}
        loading={loading}
        value={formatPrice(c.revenue?.value ?? 0)}
        change={c.revenue?.change}
        hint={c.revenue && `Previous: ${formatPrice(c.revenue.previous ?? 0)}`}
      />
      <StatCard label="Orders" icon={ShoppingBag} loading={loading} value={formatNumber(c.orders?.value)} change={c.orders?.change} to="/admin/orders" />
      <StatCard
        label="Customers"
        icon={Users}
        loading={loading}
        value={formatNumber(customersTotal ?? c.customers?.value)}
        change={c.customers?.change}
        changeSuffix="new sign-ups"
        hint={customersTotal !== undefined ? `${formatNumber(c.customers?.value)} new in this period` : undefined}
        to="/admin/customers"
      />
      <StatCard
        label="Products"
        icon={Package}
        loading={loading}
        value={formatNumber(c.products?.value)}
        hint={c.products?.published !== undefined ? `${formatNumber(c.products.published)} published` : undefined}
        to="/admin/products"
      />
    </div>
  );
}

/** Secondary, compact KPIs (board row 2). */
export function AttentionStats({ cards, loading }) {
  const c = cards ?? {};
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
      <StatCard
        compact
        label="Low stock"
        icon={AlertTriangle}
        tone={c.lowStock?.value ? 'warning' : 'neutral'}
        loading={loading}
        value={formatNumber(c.lowStock?.value)}
        hint="SKUs at or below threshold"
        to="/admin/inventory?status=low"
      />
      <StatCard
        compact
        label="Pending orders"
        icon={Clock}
        tone={c.pendingOrders?.value ? 'warning' : 'neutral'}
        loading={loading}
        value={formatNumber(c.pendingOrders?.value)}
        hint="Pending or confirmed"
        to="/admin/orders?status=pending"
      />
    </div>
  );
}

const METRICS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'orders', label: 'Orders' },
];

/** Revenue / orders over time. One metric at a time (never a dual axis). */
export function SalesCard({ series = [], granularity, loading, total }) {
  const [metric, setMetric] = useState('revenue');
  return (
    <Card className="lg:col-span-2">
      <CardHeader
        title="Revenue Overview"
        description={metric === 'revenue' ? `${formatPrice(total?.revenue ?? 0)} in this period` : `${formatNumber(total?.orders ?? 0)} orders in this period`}
        action={<Segmented label="Chart metric" options={METRICS} value={metric} onChange={setMetric} />}
      />
      {loading ? (
        <ChartSkeleton height={340} />
      ) : metric === 'revenue' ? (
        <RevenueChart data={series} granularity={granularity} height={340} />
      ) : (
        <OrdersBarChart data={series} granularity={granularity} height={340} />
      )}
    </Card>
  );
}

export function StatusCard({ items, loading }) {
  return (
    <Card>
      <CardHeader title="Order Status" description="Orders placed in this period" />
      {loading ? <ChartSkeleton height={300} /> : <OrderStatusDonut items={items} linkTo={(status) => `/admin/orders?status=${status}`} />}
    </Card>
  );
}

export function CustomersCard({ series, granularity, loading }) {
  return (
    <Card>
      <CardHeader title="New Customers" description="Sign-ups per period" />
      {loading ? <ChartSkeleton height={220} /> : <CustomersChart data={series} granularity={granularity} height={220} />}
    </Card>
  );
}

export function TopCategoriesCard({ items = [], loading }) {
  return (
    <Card>
      <CardHeader title="Top Categories" description="By revenue" />
      {loading ? (
        <ChartSkeleton height={220} />
      ) : (
        <TopList emptyTitle="No category sales yet" items={items.map((c) => ({ id: c.categoryId, name: c.name, quantity: c.quantity, revenue: c.revenue }))} />
      )}
    </Card>
  );
}

/** Titled white card that hosts a flush table. */
function TableCard({ id, title, action, children, className }) {
  return (
    <section aria-labelledby={id} className={cn('min-w-0 overflow-hidden rounded-xl border border-line bg-white', className)}>
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h2 id={id} className="text-base font-semibold text-ink-900 sm:text-lg">
          {title}
        </h2>
        {action}
      </div>
      <div className="border-t border-line">{children}</div>
    </section>
  );
}

const viewAll = (to, label) => (
  <Link to={to} className="inline-flex items-center gap-1 rounded-md text-sm font-semibold text-brand-600 hover:text-brand-700">
    {label} <ArrowRight size={15} aria-hidden="true" />
  </Link>
);

const topColumns = [
  {
    key: 'name',
    header: 'Product',
    cell: (p) => (
      <span className="flex min-w-0 items-center gap-3">
        <SmartImage src={p.thumbnail} alt="" width={80} className="h-10 w-10 shrink-0 rounded-lg border border-line bg-surface" />
        {p.productId ? (
          <Link to={`/admin/products/${p.productId}/edit`} className="line-clamp-2 max-w-56 font-medium text-ink-900 hover:text-brand-600">
            {p.name}
          </Link>
        ) : (
          <span className="line-clamp-2 max-w-56 font-medium text-ink-900">{p.name}</span>
        )}
      </span>
    ),
  },
  { key: 'quantity', header: 'Sold', align: 'right', cell: (p) => <span className="tabular-nums">{formatNumber(p.quantity)}</span> },
  { key: 'revenue', header: 'Revenue', align: 'right', cell: (p) => <span className="font-semibold whitespace-nowrap text-ink-900 tabular-nums">{formatPrice(p.revenue)}</span> },
];

export function TopProductsCard({ items = [], loading, className }) {
  return (
    <TableCard id="top-products-title" title="Top Products" action={viewAll('/admin/analytics', 'Analytics')} className={className}>
      <DataTable
        flush
        dense
        minWidth={360}
        caption="Top products by revenue"
        columns={topColumns}
        rows={items}
        rowKey={(p) => p.productId ?? p.name}
        loading={loading}
        skeletonRows={5}
        empty={{ title: 'Nothing sold yet', description: 'Rankings appear once orders are paid.' }}
      />
    </TableCard>
  );
}

const recentColumns = [
  { key: 'orderNumber', header: 'Order ID', cell: (o) => <span className="font-semibold whitespace-nowrap text-ink-900">{o.orderNumber}</span> },
  { key: 'customer', header: 'Customer', cell: (o) => <span className="block max-w-40 truncate text-ink-700">{o.customer?.name ?? '—'}</span> },
  { key: 'status', header: 'Status', cell: (o) => <StatusBadge type="order" value={o.status} /> },
  { key: 'total', header: 'Amount', align: 'right', cell: (o) => <span className="font-semibold whitespace-nowrap text-ink-900 tabular-nums">{formatPrice(o.pricing?.total)}</span> },
  { key: 'createdAt', header: 'Date', align: 'right', cell: (o) => <span className="whitespace-nowrap text-ink-500">{formatDate(o.createdAt)}</span> },
];

export function RecentOrdersCard({ orders = [], loading, onOpen, className }) {
  return (
    <TableCard id="recent-orders-title" title="Recent Orders" action={viewAll('/admin/orders', 'View all')} className={className}>
      <DataTable
        flush
        dense
        minWidth={560}
        caption="Most recent orders"
        columns={recentColumns}
        rows={orders}
        loading={loading}
        skeletonRows={5}
        onRowClick={onOpen}
        rowLabel={(o) => `Open order ${o.orderNumber}`}
        empty={{ title: 'No orders yet', description: 'New orders will show up here as soon as customers check out.' }}
      />
    </TableCard>
  );
}
