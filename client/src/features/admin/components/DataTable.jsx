import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/components/ui';
import { cn } from '@/utils/cn';
import { rangeLabel } from '../utils';

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' };

function SortHeader({ column, sort, onSortChange }) {
  const active = sort?.key === column.sortKey;
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      type="button"
      onClick={() => onSortChange(column.sortKey)}
      className={cn('inline-flex items-center gap-1 rounded uppercase hover:text-ink-900', active && 'text-ink-900')}
    >
      {column.header}
      <Icon size={13} aria-hidden="true" className={active ? 'text-ink-700' : 'text-ink-300'} />
    </button>
  );
}

/**
 * Accessible, responsive data table.
 * columns: [{ key, header, cell?: (row) => node, align?, className?, headerClassName?, sortKey?, hideBelow?: 'sm'|'md'|'lg' }]
 * The first column is sticky (from `sm` up) while the table scrolls horizontally inside its card.
 */
export function DataTable({
  columns,
  rows = [],
  rowKey = (row) => row._id,
  caption,
  loading = false,
  fetching = false,
  error,
  onRetry,
  empty = {},
  onRowClick,
  rowLabel,
  sort,
  onSortChange,
  pagination,
  onPageChange,
  skeletonRows = 6,
  className,
  dense = false,
  minWidth = 640,
  flush = false,
}) {
  const hide = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell', xl: 'hidden xl:table-cell', '2xl': 'hidden 2xl:table-cell' };
  const cellPad = dense ? 'px-4 py-2.5' : 'px-4 py-3';
  const showRows = !loading && !error && rows.length > 0;

  return (
    <div className={cn('overflow-hidden bg-white', !flush && 'rounded-xl border border-line', className)}>
      <div className="relative overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth }} aria-busy={loading || fetching || undefined}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-line bg-surface">
              {columns.map((col, i) => (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={sort?.key && sort.key === col.sortKey ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'px-4 py-3 text-xs font-semibold tracking-wide whitespace-nowrap text-ink-500 uppercase',
                    ALIGN[col.align ?? 'left'],
                    i === 0 && 'left-0 z-10 bg-surface sm:sticky',
                    col.hideBelow && hide[col.hideBelow],
                    col.headerClassName,
                  )}
                >
                  {col.sortKey && onSortChange ? <SortHeader column={col} sort={sort} onSortChange={onSortChange} /> : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn('transition-opacity', fetching && !loading && 'opacity-60')}>
            {loading &&
              Array.from({ length: skeletonRows }, (_, r) => (
                <tr key={`sk-${r}`} className="border-b border-line last:border-0" data-testid="skeleton-row">
                  {columns.map((col, i) => (
                    <td key={col.key} className={cn(cellPad, col.hideBelow && hide[col.hideBelow])}>
                      <Skeleton className={cn('h-4', i === 0 ? 'w-40' : 'w-16', col.align === 'right' && 'ml-auto')} />
                    </td>
                  ))}
                </tr>
              ))}
            {showRows &&
              rows.map((row) => {
                const clickable = Boolean(onRowClick);
                return (
                  <tr
                    key={rowKey(row)}
                    onClick={clickable ? (e) => !e.target.closest('a,button,input,select,label,[role="switch"]') && onRowClick(row) : undefined}
                    onKeyDown={
                      clickable
                        ? (e) => {
                            if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    tabIndex={clickable ? 0 : undefined}
                    aria-label={clickable && rowLabel ? rowLabel(row) : undefined}
                    className={cn(
                      'group border-b border-line last:border-0',
                      'transition-colors hover:bg-surface/70',
                      clickable && 'cursor-pointer focus-visible:bg-brand-50/60 focus-visible:outline-none',
                    )}
                  >
                    {columns.map((col, i) => {
                      const content = col.cell ? col.cell(row) : row[col.key];
                      const Tag = i === 0 ? 'th' : 'td';
                      return (
                        <Tag
                          key={col.key}
                          scope={i === 0 ? 'row' : undefined}
                          className={cn(
                            cellPad,
                            'align-middle font-normal text-ink-700',
                            ALIGN[col.align ?? 'left'],
                            i === 0 && 'left-0 z-[1] bg-white text-left group-hover:bg-surface group-focus-visible:bg-brand-50 sm:sticky',
                            col.hideBelow && hide[col.hideBelow],
                            col.className,
                          )}
                        >
                          {content ?? <span className="text-ink-300">—</span>}
                        </Tag>
                      );
                    })}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {!loading && error && <ErrorState error={error} onRetry={onRetry} compact />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState
          compact
          icon={empty.icon}
          title={empty.title ?? 'Nothing here yet'}
          description={empty.description}
          action={empty.action}
        />
      )}

      {pagination && showRows && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
          <p className="text-sm text-ink-500 tabular-nums">Showing <span className="font-medium text-ink-900">{rangeLabel(pagination)}</span></p>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={onPageChange} className="sm:ml-auto sm:justify-end" />
        </div>
      )}
    </div>
  );
}
