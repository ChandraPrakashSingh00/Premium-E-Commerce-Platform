import { useCallback, useState } from 'react';
import { AlertTriangle, Boxes, History, PackageX, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router';
import { Button, IconButton, SmartImage } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { useInventory } from '../../hooks/useInventory';
import { useListParams } from '../../hooks/shared';
import { stockState } from '../../utils';
import { DataTable } from '../DataTable';
import { FilterBar } from '../FilterBar';
import { StatCard } from '../StatCard';
import { StatusBadge } from '../StatusBadge';
import { AdjustStockModal } from './AdjustStockModal';
import { HistoryDrawer } from './HistoryDrawer';
import { STOCK_OPTIONS } from './inventoryUtils';

const STATUSES = STOCK_OPTIONS.map((o) => o.value);

function ProductCell({ row }) {
  const variant = [row.variant?.title, row.variant?.size, row.variant?.color].filter(Boolean).join(' · ');
  return (
    <div className="flex min-w-0 items-center gap-3">
      <SmartImage src={row.product?.thumbnail} alt="" width={80} className="h-10 w-10 shrink-0 rounded-lg border border-line" />
      <div className="min-w-0">
        {row.product?._id ? (
          <Link to={`/admin/products/${row.product._id}/edit`} className="block max-w-48 truncate font-medium text-ink-900 hover:text-brand-600 hover:underline">
            {row.product.name}
          </Link>
        ) : (
          <span className="font-medium text-ink-500">Deleted product</span>
        )}
        {variant && <p className="max-w-48 truncate text-xs text-ink-500">{variant}</p>}
      </div>
    </div>
  );
}

/** Per-SKU stock levels with KPI shortcuts, filters, adjust and history. */
export function StockLevelsTab() {
  const { params, setParam, reset, activeCount } = useListParams();
  const status = STATUSES.includes(params.status) ? params.status : '';
  const q = params.q ?? '';
  const query = useInventory({ page: params.page, limit: 20, q, status });
  const meta = query.data?.meta;

  const [adjust, setAdjust] = useState({ open: false, item: null, key: 0 });
  const [history, setHistory] = useState({ open: false, item: null });
  const onSearch = useCallback((value) => setParam('q', value), [setParam]);

  const filterLink = (value) => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (value) next.set('status', value);
    const search = next.toString();
    return { search: search ? `?${search}` : '' };
  };

  const kpi = ({ value, metaKey, tone, icon, label, hint }) => {
    const active = status === value;
    return (
      <StatCard
        key={metaKey}
        to={filterLink(active ? '' : value)}
        label={
          <>
            {label}
            {active && value && <span className="sr-only"> (filter applied)</span>}
          </>
        }
        value={formatNumber(meta?.[metaKey] ?? 0)}
        tone={tone}
        icon={icon}
        hint={hint}
        loading={query.isPending}
        className={cn(active && value && 'border-brand-500 ring-1 ring-brand-500')}
      />
    );
  };

  const columns = [
    { key: 'product', header: 'Product', cell: (row) => <ProductCell row={row} /> },
    { key: 'sku', header: 'SKU', cell: (row) => <span className="font-mono text-xs whitespace-nowrap text-ink-700">{row.sku}</span> },
    { key: 'available', header: 'Available', align: 'right', cell: (row) => <span className="font-semibold text-ink-900 tabular-nums">{formatNumber(row.available)}</span> },
    { key: 'reserved', header: 'Reserved', align: 'right', hideBelow: 'md', cell: (row) => <span className="tabular-nums">{formatNumber(row.reserved)}</span> },
    { key: 'sold', header: 'Sold', align: 'right', hideBelow: 'lg', cell: (row) => <span className="tabular-nums">{formatNumber(row.sold)}</span> },
    { key: 'threshold', header: 'Threshold', align: 'right', hideBelow: '2xl', cell: (row) => <span className="text-ink-500 tabular-nums">{row.lowStockThreshold}</span> },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge type="stock" value={stockState(row.available, row.lowStockThreshold)} /> },
    {
      key: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<SlidersHorizontal size={14} />}
            aria-label={`Adjust stock for ${row.sku}`}
            onClick={() => setAdjust((s) => ({ open: true, item: row, key: s.key + 1 }))}
          >
            Adjust
          </Button>
          <IconButton
            size="iconSm"
            label={`Stock history for ${row.sku}`}
            className="h-9 w-9 text-ink-500 hover:bg-brand-50 hover:text-brand-600"
            onClick={() => setHistory({ open: true, item: row })}
          >
            <History size={16} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 [&>*]:min-w-0">
        {[
          { value: '', metaKey: 'totalSkus', tone: 'neutral', icon: Boxes, label: 'Total SKUs', hint: 'All tracked variants' },
          { value: 'low', metaKey: 'lowStock', tone: 'warning', icon: AlertTriangle, label: 'Low stock', hint: 'At or below threshold · view' },
          { value: 'out', metaKey: 'outOfStock', tone: 'danger', icon: PackageX, label: 'Out of stock', hint: 'Nothing available · view' },
        ].map(kpi)}
      </div>

      <FilterBar
        search={{ value: q, onChange: onSearch, placeholder: 'Search SKU or product…', label: 'Search inventory' }}
        filters={[{ key: 'status', label: 'Stock', value: status, options: STOCK_OPTIONS, onChange: (v) => setParam('status', v) }]}
        onReset={() => reset()}
        activeCount={activeCount}
      />

      <DataTable
        caption="Stock levels"
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isPending}
        fetching={query.isFetching}
        error={query.data ? null : query.error}
        onRetry={() => query.refetch()}
        pagination={query.data?.pagination}
        onPageChange={(page) => setParam('page', page)}
        dense
        minWidth={900}
        empty={{
          icon: <Boxes size={28} strokeWidth={1.5} />,
          title: activeCount ? 'No matching SKUs' : 'No inventory yet',
          description: activeCount ? 'Try a different search or stock filter.' : 'Stock rows are created when products with variants are added.',
          action: activeCount ? (
            <Button size="sm" variant="secondary" onClick={() => reset()}>
              Clear filters
            </Button>
          ) : undefined,
        }}
      />

      <AdjustStockModal key={adjust.key} open={adjust.open} item={adjust.item} onClose={() => setAdjust((s) => ({ ...s, open: false }))} />
      <HistoryDrawer key={history.item?._id ?? 'none'} open={history.open} item={history.item} onClose={() => setHistory((s) => ({ ...s, open: false }))} />
    </>
  );
}
