import { useState } from 'react';
import { History } from 'lucide-react';
import { Drawer, EmptyState, ErrorState, Pagination, Skeleton } from '@/components/ui';
import { formatDateTime, formatNumber, formatRelative } from '@/utils/format';
import { useInventoryTransactions } from '../../hooks/useInventory';
import { rangeLabel } from '../../utils';
import { OrderLink, SignedQty, TxnTypeBadge } from './TxnParts';

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-line px-3 py-2">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="text-base font-semibold text-ink-900 tabular-nums">{formatNumber(value ?? 0)}</dd>
    </div>
  );
}

function TxnItem({ txn }) {
  return (
    <li className="relative pb-5 pl-6 last:pb-0">
      <span className="absolute top-1.5 left-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-ink-300 ring-1 ring-line" aria-hidden="true" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TxnTypeBadge type={txn.type} />
          <SignedQty value={txn.quantity} className="text-sm" />
        </div>
        <time dateTime={txn.createdAt} title={formatDateTime(txn.createdAt)} className="text-xs text-ink-500">
          {formatRelative(txn.createdAt)}
        </time>
      </div>
      {txn.reason && <p className="mt-1.5 text-sm text-ink-700">{txn.reason}</p>}
      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-500 tabular-nums">
        <span>
          Available <span className="font-medium text-ink-800">{txn.availableAfter ?? '—'}</span>
        </span>
        <span>
          Reserved <span className="font-medium text-ink-800">{txn.reservedAfter ?? '—'}</span>
        </span>
        <span>
          Sold <span className="font-medium text-ink-800">{txn.soldAfter ?? '—'}</span>
        </span>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
        {txn.order?._id && (
          <span>
            Order <OrderLink order={txn.order} />
          </span>
        )}
        <span>by {txn.performedBy?.name ?? (txn.order ? 'System' : 'Unknown')}</span>
        <span aria-hidden="true">·</span>
        <span>{formatDateTime(txn.createdAt)}</span>
      </p>
    </li>
  );
}

/** Stock movement timeline for one inventory row. Remount per item via `key`. */
export function HistoryDrawer({ open, onClose, item }) {
  const [page, setPage] = useState(1);
  const query = useInventoryTransactions({ inventoryId: item?._id, page, limit: 20 }, { enabled: open && Boolean(item?._id) });
  const items = query.data?.items ?? [];
  const pagination = query.data?.pagination;
  const variant = [item?.variant?.title, item?.variant?.size, item?.variant?.color].filter(Boolean).join(' · ');

  return (
    <Drawer open={open} onClose={onClose} title="Stock history" className="max-w-xl">
      {item && (
        <div className="space-y-5 px-5 py-5">
          <div>
            <p className="font-medium text-ink-900">{item.product?.name}</p>
            <p className="text-sm text-ink-500">
              {variant && `${variant} · `}
              <span className="font-mono text-xs">{item.sku}</span>
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-2">
              <Stat label="Available" value={item.available} />
              <Stat label="Reserved" value={item.reserved} />
              <Stat label="Sold" value={item.sold} />
            </dl>
          </div>

          <section aria-labelledby="stock-history-title" aria-busy={query.isFetching || undefined}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 id="stock-history-title" className="text-base font-semibold text-ink-900">
                Movements
              </h3>
              {pagination && <span className="text-xs text-ink-500 tabular-nums">{rangeLabel(pagination)}</span>}
            </div>

            {query.isPending ? (
              <ul className="space-y-4" aria-label="Loading history">
                {Array.from({ length: 5 }, (_, i) => (
                  <li key={i} className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </li>
                ))}
              </ul>
            ) : query.isError && !query.data ? (
              <ErrorState error={query.error} onRetry={() => query.refetch()} compact />
            ) : items.length === 0 ? (
              <EmptyState compact icon={<History size={28} strokeWidth={1.5} />} title="No movements yet" description="Reservations, sales, returns and manual adjustments will appear here." />
            ) : (
              <ol className={`relative before:absolute before:top-2 before:bottom-2 before:left-[4px] before:w-px before:bg-line ${query.isFetching ? 'opacity-60' : ''}`}>
                {items.map((txn) => (
                  <TxnItem key={txn._id} txn={txn} />
                ))}
              </ol>
            )}

            {pagination?.totalPages > 1 && (
              <Pagination className="mt-5" page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
