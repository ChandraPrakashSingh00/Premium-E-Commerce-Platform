import { History, X } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatDate, formatDateTime } from '@/utils/format';
import { useInventoryTransactions } from '../../hooks/useInventory';
import { useListParams } from '../../hooks/shared';
import { DataTable } from '../DataTable';
import { FilterBar } from '../FilterBar';
import { TXN_OPTIONS, TXN_TYPES, isObjectId } from './inventoryUtils';
import { OrderLink, SignedQty, TxnTypeBadge } from './TxnParts';

const columns = [
  {
    key: 'date',
    header: 'Date',
    cell: (t) => (
      <time dateTime={t.createdAt} title={formatDateTime(t.createdAt)} className="whitespace-nowrap text-ink-700">
        <span className="block">{formatDate(t.createdAt)}</span>
        <span className="block text-xs text-ink-400">{formatDate(t.createdAt, { hour: 'numeric', minute: '2-digit' })}</span>
      </time>
    ),
  },
  { key: 'sku', header: 'SKU', cell: (t) => <span className="font-mono text-xs whitespace-nowrap text-ink-700">{t.sku}</span> },
  { key: 'type', header: 'Type', cell: (t) => <TxnTypeBadge type={t.type} /> },
  { key: 'quantity', header: 'Change', align: 'right', cell: (t) => <SignedQty value={t.quantity} /> },
  { key: 'availableAfter', header: 'Available after', align: 'right', hideBelow: 'sm', cell: (t) => <span className="tabular-nums">{t.availableAfter ?? '—'}</span> },
  {
    key: 'reason',
    header: 'Reason',
    hideBelow: 'md',
    cell: (t) =>
      t.reason ? (
        <span className="line-clamp-2 max-w-[18rem] text-ink-600" title={t.reason}>
          {t.reason}
        </span>
      ) : null,
  },
  { key: 'order', header: 'Order', cell: (t) => (t.order?._id ? <OrderLink order={t.order} /> : null) },
  { key: 'by', header: 'By', hideBelow: 'lg', cell: (t) => <span className="text-ink-600">{t.performedBy?.name ?? (t.order ? 'System' : null)}</span> },
];

/** Global stock movement log. */
export function TransactionsTab() {
  const { params, setParam, reset, activeCount } = useListParams();
  const type = TXN_TYPES.includes(params.type) ? params.type : '';
  const productId = isObjectId(params.productId) ? params.productId : '';
  const query = useInventoryTransactions({ page: params.page, limit: 20, type, productId });
  const filtered = Boolean(type || productId);

  return (
    <>
      <FilterBar
        filters={[{ key: 'type', label: 'Type', value: type, options: TXN_OPTIONS, onChange: (v) => setParam('type', v) }]}
        onReset={() => reset(['tab'])}
        activeCount={activeCount}
      >
        {productId && (
          <span className="col-span-2 inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-white pr-1 pl-3 text-sm text-ink-700">
            One product only
            <button
              type="button"
              onClick={() => setParam('productId', undefined)}
              className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-900"
              aria-label="Remove product filter"
            >
              <X size={14} />
            </button>
          </span>
        )}
      </FilterBar>

      <DataTable
        caption="Stock transactions"
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isPending}
        fetching={query.isFetching}
        error={query.data ? null : query.error}
        onRetry={() => query.refetch()}
        pagination={query.data?.pagination}
        onPageChange={(page) => setParam('page', page)}
        dense
        empty={{
          icon: <History size={28} strokeWidth={1.5} />,
          title: filtered ? 'No matching movements' : 'No stock movements yet',
          description: filtered ? 'Try another type or clear the filters.' : 'Reservations, sales, returns and adjustments will be logged here.',
          action: filtered ? (
            <Button size="sm" variant="secondary" onClick={() => reset(['tab'])}>
              Clear filters
            </Button>
          ) : undefined,
        }}
      />
    </>
  );
}
