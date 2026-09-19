import { useState } from 'react';
import { MessageSquareText, PenLine, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Badge, ConfirmationModal, EmptyState, ErrorState, IconButton, Pagination, Rating, Skeleton, SmartImage } from '@/components/ui';
import { AccountPageHeader } from '@/features/account/components/AccountBits';
import { refreshMyReviews, useDeleteReview, useMyReviews } from '@/features/account/hooks';
import ReviewFormModal from '@/features/reviews/ReviewFormModal';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';

const STATUS = {
  pending: { tone: 'warning', label: 'In moderation' },
  approved: { tone: 'success', label: 'Published' },
  rejected: { tone: 'danger', label: 'Not published' },
};

function ReviewRow({ review, onEdit, onDelete }) {
  const product = review.product;
  const status = STATUS[review.status] ?? { tone: 'neutral', label: review.status };
  return (
    <article className="flex gap-4 rounded-2xl border border-line bg-white p-4 sm:p-5">
      {product ? (
        <Link to={`/product/${product.slug}`} className="shrink-0" tabIndex={-1} aria-hidden="true">
          <SmartImage src={product.thumbnail} alt="" width={160} className="h-20 w-16 rounded-xl border border-line sm:h-24 sm:w-20" />
        </Link>
      ) : (
        <div className="h-20 w-16 shrink-0 rounded-xl bg-surface sm:h-24 sm:w-20" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {product ? (
              <Link to={`/product/${product.slug}`} className="line-clamp-1 text-sm font-semibold text-ink-900 hover:underline">
                {product.name}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-ink-500">Product no longer available</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Rating value={review.rating} size={13} />
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
          </div>
          <div className="-mt-1 -mr-1 flex shrink-0">
            {product && (
              <IconButton label="Edit review" size="iconSm" onClick={() => onEdit(review)}>
                <PenLine size={15} />
              </IconButton>
            )}
            <IconButton label="Delete review" size="iconSm" onClick={() => onDelete(review)}>
              <Trash2 size={15} />
            </IconButton>
          </div>
        </div>
        <h2 className="mt-3 text-sm font-semibold text-ink-900">{review.title}</h2>
        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-ink-600">{review.comment}</p>
        <p className="mt-2 text-xs text-ink-400">{formatDate(review.createdAt)}</p>
        {review.status === 'rejected' && (
          <p className="mt-2 text-xs text-ink-500">This review did not meet our guidelines. You can edit and resubmit it.</p>
        )}
        {review.adminReply && (
          <div className="mt-3 rounded-xl bg-surface p-3 text-xs leading-relaxed text-ink-600">
            <span className="font-semibold text-ink-900">Our reply: </span>
            {review.adminReply}
          </div>
        )}
      </div>
    </article>
  );
}

export default function ReviewsPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const { data, isLoading, isError, error, refetch, isPlaceholderData } = useMyReviews({ page, limit: 10 });
  const remove = useDeleteReview();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const reviews = data?.items ?? [];

  return (
    <>
      <Seo title="My reviews" noindex />
      <AccountPageHeader title="Reviews" description="Reviews you have shared with the community." />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} compact className="card" />
      ) : reviews.length === 0 ? (
        <EmptyState
          className="card"
          icon={<MessageSquareText size={28} strokeWidth={1.5} />}
          title="No reviews yet"
          description="Once an order is delivered, you can review its items from the order page."
          action={<Link to="/account/orders" className="link text-sm">Go to my orders</Link>}
        />
      ) : (
        <>
          <ul className={cn('space-y-3 transition-opacity', isPlaceholderData && 'opacity-60')}>
            {reviews.map((review) => (
              <li key={review._id}>
                <ReviewRow review={review} onEdit={setEditing} onDelete={setDeleting} />
              </li>
            ))}
          </ul>
          <Pagination
            className="mt-8"
            page={data.pagination?.page ?? page}
            totalPages={data.pagination?.totalPages}
            onChange={(p) => setParams(p > 1 ? { page: String(p) } : {})}
          />
        </>
      )}

      <ReviewFormModal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        productId={editing?.product?._id}
        productName={editing?.product?.name}
        review={editing}
        onSaved={() => {
          setEditing(null);
          refreshMyReviews();
        }}
      />

      <ConfirmationModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this review?"
        description={deleting?.product?.name}
        confirmLabel="Delete review"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
