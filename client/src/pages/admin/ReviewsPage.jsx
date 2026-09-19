import { useCallback, useMemo, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { Button, ConfirmationModal, EmptyState, ErrorState, Pagination, Tabs } from '@/components/ui';
import { FilterBar, PageHeader } from '@/features/admin/components';
import { ReviewCard, ReviewCardSkeleton } from '@/features/admin/components/reviews/ReviewCard';
import { ReviewReplyModal } from '@/features/admin/components/reviews/ReviewReplyModal';
import { useListParams } from '@/features/admin/hooks/shared';
import { useAdminReviews, useDeleteReview, useModerateReview } from '@/features/admin/hooks/useReviews';
import { rangeLabel } from '@/features/admin/utils';

const TABS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
];

const RATING_OPTIONS = [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? 's' : ''}` }));

const EMPTY_COPY = {
  pending: { title: 'All caught up', description: 'There are no reviews waiting for moderation.' },
  approved: { title: 'No approved reviews', description: 'Approved reviews are visible on product pages.' },
  rejected: { title: 'No rejected reviews', description: 'Reviews you reject will show up here.' },
  all: { title: 'No reviews yet', description: 'Customer reviews will appear here once they are submitted.' },
};

export default function ReviewsPage() {
  const { params, setParam, setParams, reset } = useListParams();
  const { page, q = '', rating = '' } = params;
  const status = TABS.some((t) => t.value === params.status) ? params.status : 'pending';

  const apiParams = useMemo(
    () => ({ page, limit: 10, q, rating, status: status === 'all' ? undefined : status }),
    [page, q, rating, status],
  );
  const query = useAdminReviews(apiParams);
  const moderate = useModerateReview();
  const remove = useDeleteReview();

  const [replyTo, setReplyTo] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const onSearch = useCallback((v) => setParam('q', v), [setParam]);
  const activeCount = [q, rating].filter(Boolean).length;
  const clearFilters = () => reset(['status']);

  const items = query.data?.items ?? [];
  const pagination = query.data?.pagination;
  const hasFilters = activeCount > 0;
  const empty = hasFilters
    ? { title: 'No reviews match your filters', description: 'Try a different search or rating.' }
    : EMPTY_COPY[status];

  const pendingFor = (id) => (moderate.isPending && moderate.variables?.id === id ? moderate.variables.status : undefined);

  const saveReply = (adminReply) =>
    moderate.mutate({ id: replyTo._id, adminReply }, { onSuccess: () => setReplyTo(null) });

  const confirmDelete = () => remove.mutate(deleting._id, { onSettled: () => setDeleting(null) });

  return (
    <>
      <PageHeader title="Reviews" description="Moderate customer reviews before they appear on product pages, and reply publicly." />

      <Tabs tabs={TABS} value={status} onChange={(v) => setParam('status', v === 'pending' ? undefined : v)} className="mb-4" />

      <FilterBar
        search={{ value: q, onChange: onSearch, placeholder: 'Search title, comment…', label: 'Search reviews' }}
        filters={[{ key: 'rating', label: 'Rating', allText: 'All Ratings', value: rating, options: RATING_OPTIONS, onChange: (v) => setParam('rating', v) }]}
        activeCount={activeCount}
        onReset={clearFilters}
      />

      <div id={`panel-${status}`} role="tabpanel" aria-labelledby={`tab-${status}`} aria-busy={query.isFetching || undefined}>
        {query.isPending ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <ReviewCardSkeleton key={i} />
            ))}
          </div>
        ) : query.isError ? (
          <div className="rounded-xl border border-line bg-white">
            <ErrorState error={query.error} onRetry={query.refetch} compact />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-line bg-white">
            <EmptyState
              compact
              icon={<MessageSquareText size={28} strokeWidth={1.5} />}
              title={empty.title}
              description={empty.description}
              action={
                hasFilters ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className={`space-y-4 transition-opacity ${query.isFetching ? 'opacity-60' : ''}`}>
            {items.map((review) => (
              <ReviewCard
                key={review._id}
                review={review}
                pendingStatus={pendingFor(review._id)}
                onModerate={(next) => moderate.mutate({ id: review._id, status: next })}
                onReply={() => setReplyTo(review)}
                onDelete={() => setDeleting(review)}
              />
            ))}
            {pagination && (
              <div className="flex flex-col items-center justify-between gap-3 pt-2 sm:flex-row">
                <p className="text-xs text-ink-500 tabular-nums">{rangeLabel(pagination)}</p>
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={(p) => setParams({ page: p })} />
              </div>
            )}
          </div>
        )}
      </div>

      <ReviewReplyModal review={replyTo} onClose={() => setReplyTo(null)} onSubmit={saveReply} loading={moderate.isPending && Boolean(replyTo)} />

      <ConfirmationModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title="Delete this review?"
        confirmLabel="Delete review"
      >
        <p className="text-sm leading-relaxed text-ink-600">
          “{deleting?.title}” by {deleting?.user?.name ?? 'a customer'} will be permanently removed and the product rating recalculated. This cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  );
}
