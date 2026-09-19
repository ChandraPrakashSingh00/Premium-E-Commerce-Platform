import { X } from 'lucide-react';
import { EmptyState, ErrorState, Pagination, Select, Skeleton, SkeletonText } from '@/components/ui';
import { REVIEW_SORTS, useToggleHelpful } from '../hooks';
import { ReviewItem } from './ReviewItem';

function ListSkeleton() {
  return (
    <div className="divide-y divide-line" aria-hidden="true">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="py-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-3.5 w-32" />
          </div>
          <Skeleton className="mt-4 h-4 w-48" />
          <SkeletonText className="mt-3" lines={2} />
        </div>
      ))}
    </div>
  );
}

/**
 * Review list with sort, rating filter chip and pagination.
 * Props: `productId`, `query` (useProductReviews result), `sort`, `onSort`, `rating`, `onRating`, `onPage`.
 */
export function ReviewList({ productId, query, sort, onSort, rating, onRating, onPage }) {
  const helpful = useToggleHelpful(productId);
  const { data, isPending, isError, error, refetch, isPlaceholderData } = query;
  const items = data?.items ?? [];
  const total = data?.pagination?.total ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-ink-700">
            {total} {total === 1 ? 'review' : 'reviews'}
          </p>
          {rating && (
            <button
              type="button"
              onClick={() => onRating(null)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand-50 pr-2.5 pl-3 text-xs font-semibold text-brand-600 hover:bg-brand-100"
              aria-label={`Remove ${rating} star filter`}
            >
              {rating}★ only <X size={13} aria-hidden="true" />
            </button>
          )}
        </div>
        <Select
          aria-label="Sort reviews"
          size="sm"
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          options={REVIEW_SORTS}
          className="w-44"
        />
      </div>

      {isPending ? (
        <ListSkeleton />
      ) : isError && !data ? (
        <ErrorState error={error} onRetry={refetch} compact />
      ) : items.length === 0 ? (
        <EmptyState
          compact
          title={rating ? `No ${rating}-star reviews yet` : 'No reviews yet'}
          description={rating ? 'Try another rating filter.' : 'Be the first to share your thoughts on this product.'}
        />
      ) : (
        <>
          <div className={isPlaceholderData ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
            <ul className="divide-y divide-line">
              {items.map((review) => (
                <li key={review._id}>
                  <ReviewItem review={review} onHelpful={helpful.toggle} helpfulPending={helpful.pendingId === review._id} />
                </li>
              ))}
            </ul>
          </div>
          <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={onPage} className="mt-6" />
        </>
      )}
    </div>
  );
}

export default ReviewList;
