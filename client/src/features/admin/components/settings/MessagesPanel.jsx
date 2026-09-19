import { useState } from 'react';
import { Inbox } from 'lucide-react';
import { Button, EmptyState, ErrorState, Pagination, Skeleton, controlClasses } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatDateTime, formatRelative } from '@/utils/format';
import { useContactMessages, useUpdateMessage } from '../../hooks/useSettings';
import { rangeLabel } from '../../utils';
import { FilterSelect } from '../FilterBar';
import { StatusBadge } from '../StatusBadge';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'resolved', label: 'Resolved' },
];
const PREVIEW_LENGTH = 180;

function MessageRow({ message, onStatusChange, saving }) {
  const [expanded, setExpanded] = useState(false);
  const long = message.message.length > PREVIEW_LENGTH;
  const selectId = `message-status-${message._id}`;

  return (
    <li className={cn('px-5 py-4', message.status === 'new' && 'bg-brand-50/30')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-semibold text-ink-900">{message.name}</p>
            <a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`} className="text-sm break-all text-brand-600 hover:underline">
              {message.email}
            </a>
            <StatusBadge type="message" value={message.status} />
          </div>
          <p className="mt-1 text-sm font-medium text-ink-900">{message.subject}</p>
          <p className={cn('mt-1 text-sm leading-relaxed whitespace-pre-line text-ink-600', !expanded && 'line-clamp-2')}>{message.message}</p>
          {long && (
            <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="mt-1 text-xs font-semibold text-brand-600 hover:underline">
              {expanded ? 'Show less' : 'Read full message'}
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end">
          <time dateTime={message.createdAt} title={formatDateTime(message.createdAt)} className="text-xs text-ink-500">
            {formatRelative(message.createdAt)}
          </time>
          <div>
            <label htmlFor={selectId} className="sr-only">
              Status for message from {message.name}
            </label>
            <select
              id={selectId}
              value={message.status}
              disabled={saving}
              onChange={(e) => onStatusChange(e.target.value)}
              className={cn(controlClasses(false), 'h-9 w-32 rounded-lg px-3 text-sm disabled:opacity-60')}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </li>
  );
}

function MessagesSkeleton() {
  return (
    <ul className="divide-y divide-line" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="space-y-2 px-5 py-4">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3.5 w-full" />
        </li>
      ))}
    </ul>
  );
}

/** Contact form inbox. `status`/`page` come from the URL (`mstatus`, `page`). */
export function MessagesPanel({ status, page, onStatusFilter, onPageChange }) {
  const query = useContactMessages({ page, limit: 20, status });
  const update = useUpdateMessage();
  const items = query.data?.items ?? [];
  const pagination = query.data?.pagination;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterSelect label="Status" value={status} options={STATUS_OPTIONS} onChange={onStatusFilter} className="w-48" />
        {status && (
          <Button variant="ghost" size="sm" onClick={() => onStatusFilter('')}>
            Clear filter
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white" aria-busy={query.isFetching || undefined}>
        {query.isPending ? (
          <MessagesSkeleton />
        ) : query.isError ? (
          <ErrorState error={query.error} onRetry={query.refetch} compact />
        ) : items.length === 0 ? (
          <EmptyState
            compact
            icon={<Inbox size={28} strokeWidth={1.5} />}
            title={status ? `No ${status} messages` : 'No messages yet'}
            description={status ? 'Try another status.' : 'Messages sent through the contact form will appear here.'}
          />
        ) : (
          <>
            <ul className={cn('divide-y divide-line transition-opacity', query.isFetching && 'opacity-60')}>
              {items.map((m) => (
                <MessageRow
                  key={m._id}
                  message={m}
                  saving={update.isPending && update.variables?.id === m._id}
                  onStatusChange={(next) => update.mutate({ id: m._id, status: next })}
                />
              ))}
            </ul>
            {pagination && (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-4 py-3 sm:flex-row">
                <p className="text-xs text-ink-500 tabular-nums">{rangeLabel(pagination)}</p>
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={onPageChange} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
