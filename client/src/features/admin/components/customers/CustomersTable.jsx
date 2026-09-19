import { Users } from 'lucide-react';
import { Badge } from '@/components/ui';
import { formatDate, formatNumber, formatPrice, formatRelative } from '@/utils/format';
import { DataTable } from '../DataTable';
import { StatusBadge } from '../StatusBadge';
import { CustomerAvatar } from './CustomerAvatar';

const COLUMNS = [
  {
    key: 'customer',
    header: 'Customer',
    cell: (c) => (
      <div className="flex min-w-0 items-center gap-3">
        <CustomerAvatar name={c.name} />
        <div className="min-w-0">
          <p className="max-w-[200px] truncate font-medium text-ink-900">{c.name}</p>
          <p className="max-w-[200px] truncate text-xs text-ink-500">{c.email}</p>
        </div>
      </div>
    ),
  },
  { key: 'phone', header: 'Phone', hideBelow: 'md', cell: (c) => (c.phone ? <span className="tabular-nums">{c.phone}</span> : null) },
  { key: 'orders', header: 'Orders', align: 'right', cell: (c) => <span className="tabular-nums">{formatNumber(c.orderCount)}</span> },
  {
    key: 'spent',
    header: 'Total spent',
    align: 'right',
    cell: (c) => <span className="font-medium text-ink-900 tabular-nums">{formatPrice(c.totalSpent)}</span>,
  },
  {
    key: 'lastOrder',
    header: 'Last order',
    cell: (c) =>
      c.lastOrderAt ? (
        <time dateTime={c.lastOrderAt} title={formatDate(c.lastOrderAt)} className="whitespace-nowrap">
          {formatRelative(c.lastOrderAt)}
        </time>
      ) : null,
  },
  {
    key: 'joined',
    header: 'Joined',
    hideBelow: 'lg',
    cell: (c) => <span className="whitespace-nowrap tabular-nums">{formatDate(c.createdAt)}</span>,
  },
  {
    key: 'status',
    header: 'Status',
    cell: (c) => (
      <div className="flex flex-wrap items-center gap-1.5">
        <StatusBadge type="customer" value={c.status} />
        {!c.isEmailVerified && <Badge tone="neutral">Unverified</Badge>}
      </div>
    ),
  },
];

export function CustomersTable({ query, onRowClick, onPageChange, hasFilters, onReset }) {
  const { data } = query;
  return (
    <DataTable
      caption="Customers"
      columns={COLUMNS}
      rows={data?.items ?? []}
      loading={query.isPending}
      fetching={query.isFetching}
      error={query.error}
      onRetry={query.refetch}
      pagination={data?.pagination}
      onPageChange={onPageChange}
      onRowClick={onRowClick}
      rowLabel={(c) => `View customer ${c.name}`}
      empty={{
        icon: <Users size={28} strokeWidth={1.5} />,
        title: hasFilters ? 'No customers match your filters' : 'No customers yet',
        description: hasFilters ? 'Try a different search or clear the filters.' : 'Customers appear here once they create an account.',
        action: hasFilters ? (
          <button type="button" onClick={onReset} className="text-sm font-semibold text-brand-600 hover:underline">
            Clear filters
          </button>
        ) : undefined,
      }}
    />
  );
}
