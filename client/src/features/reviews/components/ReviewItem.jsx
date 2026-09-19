import { memo, useState } from 'react';
import { BadgeCheck, MessageSquareReply, ThumbsUp } from 'lucide-react';
import { ProductLightbox } from '@/components/product/ProductLightbox';
import { Rating } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';
import { imageUrl } from '@/utils/image';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || 'A';

function ReviewItemBase({ review, onHelpful, helpfulPending }) {
  const [viewer, setViewer] = useState(null);
  const images = review.images ?? [];
  return (
    <article className="py-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {review.user?.avatar ? (
            <img src={imageUrl(review.user.avatar, 80)} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600" aria-hidden="true">
              {initials(review.user?.name)}
            </span>
          )}
          <div>
            <p className="text-sm font-semibold text-ink-900">{review.user?.name ?? 'Customer'}</p>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
              <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 font-medium text-success-600">
                  <BadgeCheck size={13} aria-hidden="true" /> Verified purchase
                </span>
              )}
            </p>
          </div>
        </div>
        <Rating value={review.rating} size={14} className="shrink-0" />
      </header>

      <h3 className="mt-4 text-[15px] font-semibold text-ink-900">{review.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line text-ink-600">{review.comment}</p>

      {images.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {images.map((img, i) => (
            <li key={img.url}>
              <button type="button" onClick={() => setViewer(i)} className="block h-20 w-20 overflow-hidden rounded-lg border border-line bg-surface" aria-label={`View photo ${i + 1} from ${review.user?.name ?? 'customer'}`}>
                <img src={imageUrl(img.url, 200)} alt="" className="h-full w-full object-cover transition-transform hover:scale-105" loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {review.adminReply && (
        <div className="mt-4 rounded-xl border-l-4 border-brand-500 bg-brand-50/60 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold text-ink-900">
            <MessageSquareReply size={14} className="text-brand-500" aria-hidden="true" /> Response from BlueMart
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{review.adminReply}</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => onHelpful(review._id)}
        disabled={helpfulPending}
        aria-pressed={Boolean(review.isHelpful)}
        className={cn(
          'mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-xs font-medium transition-colors disabled:opacity-60',
          review.isHelpful ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-line text-ink-600 hover:border-brand-300 hover:text-brand-600',
        )}
      >
        <ThumbsUp size={14} aria-hidden="true" />
        Helpful{review.helpfulCount > 0 ? ` (${review.helpfulCount})` : ''}
      </button>

      {images.length > 0 && (
        <ProductLightbox
          open={viewer !== null}
          onClose={() => setViewer(null)}
          images={images.map((img) => ({ url: img.url, alt: `Photo by ${review.user?.name ?? 'customer'}` }))}
          index={viewer ?? 0}
          onIndexChange={setViewer}
          name={review.title}
        />
      )}
    </article>
  );
}

export const ReviewItem = memo(ReviewItemBase);
export default ReviewItem;
