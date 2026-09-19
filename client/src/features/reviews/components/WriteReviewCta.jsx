import { useState } from 'react';
import { useLocation } from 'react-router';
import { Info, PenLine } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { INELIGIBLE_REASONS, useReviewEligibility } from '../hooks';
import ReviewFormModal from '../ReviewFormModal';

/** "Write a review" call to action, gated by GET /reviews/eligibility/:productId. Props: `productId`, `productName`. */
export function WriteReviewCta({ productId, productName }) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { pathname } = useLocation();
  const { data, isPending, isError } = useReviewEligibility(productId);
  const [open, setOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5">
        <p className="text-sm font-semibold text-ink-900">Share your thoughts</p>
        <p className="mt-1 text-sm text-ink-500">Sign in to review products you’ve purchased.</p>
        <Button to={`/login?redirect=${encodeURIComponent(`${pathname}#reviews`)}`} variant="outline" fullWidth className="mt-4">
          Sign in to Write a Review
        </Button>
      </div>
    );
  }

  if (isPending) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (isError) return null;

  const existing = data?.existingReview;
  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <p className="text-sm font-semibold text-ink-900">{existing ? 'Your review' : 'Share your thoughts'}</p>
      {data?.canReview ? (
        <>
          <p className="mt-1 text-sm text-ink-500">Help other shoppers decide with an honest review.</p>
          <Button fullWidth className="mt-4" leftIcon={<PenLine size={16} />} onClick={() => setOpen(true)}>
            Write a Review
          </Button>
        </>
      ) : (
        <>
          <p className="mt-1 flex items-start gap-2 text-sm text-ink-500">
            <Info size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            {existing?.status === 'pending'
              ? 'Your review is awaiting approval.'
              : (INELIGIBLE_REASONS[data?.reason] ?? 'You can’t review this product right now.')}
          </p>
          {existing && (
            <Button variant="outline" fullWidth className="mt-4" leftIcon={<PenLine size={16} />} onClick={() => setOpen(true)}>
              Edit Your Review
            </Button>
          )}
        </>
      )}
      <ReviewFormModal open={open} onClose={() => setOpen(false)} productId={productId} productName={productName} review={existing} />
    </div>
  );
}

export default WriteReviewCta;
