import { Pencil, TicketPercent, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { formatDate, formatNumber, formatPrice } from '@/utils/format';
import { couponState } from '../../utils';
import { DataTable } from '../DataTable';
import { TogglePill } from '../TogglePill';
import { StatusBadge } from '../StatusBadge';
import { formatDiscount } from './couponSchema';

function UsageCell({ coupon }) {
  const limited = coupon.usageLimit > 0;
  const pct = limited ? Math.min(100, Math.round((coupon.usedCount / coupon.usageLimit) * 100)) : 0;
  return (
    <div className="min-w-[96px]">
      <p className="text-ink-900 tabular-nums">
        {formatNumber(coupon.usedCount)} <span className="text-ink-400">/</span> {limited ? formatNumber(coupon.usageLimit) : '∞'}
      </p>
      {limited && (
        <div
          className="mt-1 h-1 w-full overflow-hidden rounded-full bg-ink-100"
          role="progressbar"
          aria-label="Usage"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className={pct >= 100 ? 'h-full bg-warning-600' : 'h-full bg-brand-500'} style={{ width: `${pct}%` }} />
        </div>
      )}
      <p className="mt-0.5 text-xs text-ink-500">{coupon.perUserLimit ?? 1} per customer</p>
    </div>
  );
}

function buildColumns({ onToggle, onEdit, onDelete, togglingId }) {
  return [
    {
      key: 'code',
      header: 'Code',
      cell: (c) => (
        <div className="min-w-0">
          <p className="font-mono font-semibold tracking-wide text-ink-900">{c.code}</p>
          {c.description && <p className="max-w-44 truncate text-xs text-ink-500">{c.description}</p>}
        </div>
      ),
    },
    { key: 'discount', header: 'Discount', cell: (c) => <span className="whitespace-nowrap text-ink-900 tabular-nums">{formatDiscount(c)}</span> },
    {
      key: 'min',
      header: 'Min. order',
      align: 'right',
      hideBelow: 'md',
      cell: (c) => (c.minOrderAmount > 0 ? <span className="tabular-nums">{formatPrice(c.minOrderAmount)}</span> : <span className="text-ink-400">None</span>),
    },
    { key: 'usage', header: 'Usage', cell: (c) => <UsageCell coupon={c} /> },
    {
      key: 'validity',
      header: 'Validity',
      hideBelow: 'lg',
      cell: (c) => (
        <span className="block text-xs whitespace-nowrap text-ink-600 tabular-nums">
          {formatDate(c.startsAt)} –<br />
          {formatDate(c.expiresAt)}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (c) => <StatusBadge type="coupon" value={couponState(c)} /> },
    {
      key: 'active',
      header: 'Active',
      cell: (c) => (
        <TogglePill
          checked={Boolean(c.isActive)}
          onText="On"
          offText="Off"
          disabled={togglingId === c._id}
          onChange={(v) => onToggle(c, v)}
          label={`Active: ${c.code}`}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (c) => (
        <div className="flex justify-end gap-1">
          <IconButton label={`Edit ${c.code}`} size="iconSm" className="text-ink-500 hover:bg-brand-50 hover:text-brand-600" onClick={() => onEdit(c)}>
            <Pencil size={15} />
          </IconButton>
          <IconButton label={`Delete ${c.code}`} size="iconSm" className="text-ink-500 hover:bg-danger-50 hover:text-danger-600" onClick={() => onDelete(c)}>
            <Trash2 size={15} />
          </IconButton>
        </div>
      ),
    },
  ];
}

export function CouponsTable({ query, onPageChange, onRowClick, onToggle, onEdit, onDelete, togglingId, hasFilters, emptyAction }) {
  const { data } = query;
  return (
    <DataTable
      caption="Coupons"
      columns={buildColumns({ onToggle, onEdit, onDelete, togglingId })}
      rows={data?.items ?? []}
      loading={query.isPending}
      fetching={query.isFetching}
      error={query.error}
      onRetry={query.refetch}
      pagination={data?.pagination}
      onPageChange={onPageChange}
      onRowClick={onRowClick}
      rowLabel={(c) => `View coupon ${c.code}`}
      empty={{
        icon: <TicketPercent size={28} strokeWidth={1.5} />,
        title: hasFilters ? 'No coupons match your filters' : 'No coupons yet',
        description: hasFilters ? 'Try a different search or status.' : 'Create a coupon to run a promotion.',
        action: emptyAction,
      }}
    />
  );
}
