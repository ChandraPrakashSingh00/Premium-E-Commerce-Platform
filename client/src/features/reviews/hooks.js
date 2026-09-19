import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { queryClient, queryKeys } from '@/services/queryClient';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { reviewsApi } from './api';

export const REVIEW_SORTS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'helpful', label: 'Most helpful' },
  { value: 'rating-high', label: 'Highest rated' },
  { value: 'rating-low', label: 'Lowest rated' },
];

export const INELIGIBLE_REASONS = {
  already_reviewed: 'You have already reviewed this product.',
  not_purchased: 'Only customers who have received this product can review it.',
};

/** Approved reviews for a product: `{ items, pagination, meta: { summary } }`. */
export function useProductReviews(productId, params) {
  return useQuery({
    queryKey: queryKeys.reviews(productId, params),
    queryFn: () => reviewsApi.list(productId, params),
    enabled: Boolean(productId),
    placeholderData: keepPreviousData,
  });
}

/** `{ canReview, reason?, existingReview? }` – only fetched for signed-in shoppers. */
export function useReviewEligibility(productId) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  return useQuery({
    queryKey: queryKeys.reviewEligibility(productId),
    queryFn: () => reviewsApi.eligibility(productId),
    enabled: Boolean(productId) && isAuthenticated,
  });
}

const invalidateProductReviews = (productId) => {
  queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
  queryClient.invalidateQueries({ queryKey: queryKeys.reviewEligibility(productId) });
  queryClient.invalidateQueries({ queryKey: ['account', 'reviews'] });
  queryClient.invalidateQueries({ queryKey: ['products', 'detail'] });
};

/** Helpful vote toggle. Guests get a toast with a sign-in action. */
export function useToggleHelpful(productId) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: (reviewId) => reviewsApi.toggleHelpful(reviewId),
    onSuccess: ({ helpfulCount, isHelpful }, reviewId) => {
      queryClient.setQueriesData({ queryKey: ['reviews', productId] }, (old) =>
        old?.items
          ? { ...old, items: old.items.map((r) => (r._id === reviewId ? { ...r, helpfulCount, isHelpful } : r)) }
          : old,
      );
    },
    onError: (error) => toast.error('Could not record your vote', error.message),
  });

  return {
    toggle: (reviewId) => {
      if (!isAuthenticated) {
        const redirect = `${window.location.pathname}${window.location.search}`;
        toast.show({
          title: 'Sign in to vote',
          description: 'Let other shoppers know which reviews helped you.',
          action: { label: 'Sign in', onClick: () => navigate(`/login?redirect=${encodeURIComponent(redirect)}`) },
        });
        return;
      }
      mutation.mutate(reviewId);
    },
    pendingId: mutation.isPending ? mutation.variables : null,
  };
}

/** Create (POST) or update (PATCH) a review. */
export function useSaveReview({ productId, reviewId } = {}) {
  return useMutation({
    mutationFn: (values) => (reviewId ? reviewsApi.update(reviewId, values) : reviewsApi.create({ productId, ...values })),
    onSuccess: () => invalidateProductReviews(productId),
  });
}

export function useDeleteReview(productId) {
  return useMutation({
    mutationFn: (reviewId) => reviewsApi.remove(reviewId),
    onSuccess: () => {
      invalidateProductReviews(productId);
      toast.success('Review deleted');
    },
    onError: (error) => toast.error('Could not delete review', error.message),
  });
}

export function useUploadReviewImages() {
  return useMutation({ mutationFn: (files) => reviewsApi.uploadImages(files) });
}
