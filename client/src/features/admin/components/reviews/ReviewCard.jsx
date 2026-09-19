import { useState } from 'react';
import { BadgeCheck, Check, CornerDownRight, ExternalLink, MessageSquareReply, Trash2, X } from 'lucide-react';
import { Badge, Button, Rating, Skeleton, SmartImage } from '@/components/ui';
import { formatDate, formatDateTime } from '@/utils/format';
import { StatusBadge } from '../StatusBadge';

const LONG_COMMENT = 280;

function ProductInfo({ product }) {
  if (!product) return <p className="text-sm text-ink-500">Product removed</p>;
  return (
    <a
      href={`/product/${product.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-w-0 items-center gap-3"
    >
      <SmartImage src={product.thumbnail} alt="" width={96} className="h-12 w-12 shrink-0 rounded-lg border border-line" />
      <span className="min-w-0">
        <span className="flex items-center gap-1 text-sm font-medium text-ink-900 group-hover:text-brand-600">
          <span className="truncate">{product.name}</span>
          <ExternalLink size={13} className="shrink-0 text-ink-400" aria-hidden="true" />
        </span>
        <span className="sr-only"> (opens in a new tab)</span>
      </span>
    </a>
  );
}

/**
 * Review moderation card. `onModerate(status)`, `onReply()`, `onDelete()`.
 * `pendingStatus` is the status currently being saved for this review (for button spinners).
 */
export function ReviewCard({ review, onModerate, onReply, onDelete, pendingStatus }) {
  const [expanded, setExpanded] = useState(false);
  const long = (review.comment?.length ?? 0) > LONG_COMMENT;
  const busy = Boolean(pendingStatus);

  return (
    <article className="rounded-xl border border-line bg-white" aria-labelledby={`review-${review._id}-title`}>
      <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <ProductInfo product={review.product} />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <StatusBadge type="review" value={review.status} />
          <time dateTime={review.createdAt} title={formatDateTime(review.createdAt)} className="text-xs text-ink-500">
            {formatDate(review.createdAt)}
          </time>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Rating value={review.rating} />
          {review.isVerifiedPurchase && (
            <Badge tone="success">
              <BadgeCheck size={13} aria-hidden="true" /> Verified purchase
            </Badge>
          )}
          <p className="min-w-0 text-xs text-ink-500">
            by <span className="font-medium text-ink-700">{review.user?.name ?? 'Deleted user'}</span>
            {review.user?.email && <span className="break-all"> · {review.user.email}</span>}
          </p>
        </div>

        <div>
          <h3 id={`review-${review._id}-title`} className="text-sm font-semibold text-ink-900">
            {review.title}
          </h3>
          <p className={`mt-1 text-sm leading-relaxed whitespace-pre-line text-ink-700 ${long && !expanded ? 'line-clamp-4' : ''}`}>
            {review.comment}
          </p>
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-1 text-xs font-semibold text-brand-600 hover:underline"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {review.images?.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Review photos">
            {review.images.map((img, i) => (
              <li key={`${img.url}-${i}`}>
                <a href={img.url} target="_blank" rel="noopener noreferrer" className="block rounded-lg" aria-label={`Open photo ${i + 1} in a new tab`}>
                  <SmartImage src={img.url} alt="" width={128} className="h-16 w-16 rounded-lg border border-line hover:opacity-90" />
                </a>
              </li>
            ))}
          </ul>
        )}

        {review.adminReply && (
          <div className="ml-2 flex gap-2 rounded-xl border-l-2 border-ink-200 bg-surface px-4 py-3 sm:ml-6">
            <CornerDownRight size={15} className="mt-0.5 shrink-0 text-ink-400" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-700">Store reply</p>
              <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-line text-ink-700">{review.adminReply}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">
        {review.status !== 'approved' && (
          <Button size="sm" variant="primary" leftIcon={<Check size={15} />} loading={pendingStatus === 'approved'} disabled={busy} onClick={() => onModerate('approved')}>
            Approve
          </Button>
        )}
        {review.status !== 'rejected' && (
          <Button size="sm" variant="secondary" leftIcon={<X size={15} />} loading={pendingStatus === 'rejected'} disabled={busy} onClick={() => onModerate('rejected')}>
            Reject
          </Button>
        )}
        <Button size="sm" variant="ghost" leftIcon={<MessageSquareReply size={15} />} onClick={onReply}>
          {review.adminReply ? 'Edit reply' : 'Reply'}
        </Button>
        <Button size="sm" variant="ghost" className="ml-auto text-danger-600 hover:bg-danger-50 hover:text-danger-600" leftIcon={<Trash2 size={15} />} onClick={onDelete}>
          Delete
        </Button>
      </div>
    </article>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-white p-5" aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="mt-5 space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-4 w-60" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
    </div>
  );
}
