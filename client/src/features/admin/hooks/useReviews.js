import { useQuery } from '@tanstack/react-query';
import { reviewsApi } from '../api/reviews';
import { adminKey, listQueryOptions, useAdminMutation } from './shared';

export const useAdminReviews = (params) =>
  useQuery({ queryKey: adminKey('reviews', params), queryFn: () => reviewsApi.list(params), ...listQueryOptions });

/** vars: `{ id, status?, adminReply? }` */
export const useModerateReview = (opts = {}) =>
  useAdminMutation({
    mutationFn: ({ id, ...body }) => reviewsApi.update(id, body),
    invalidate: [['reviews'], ['products']],
    invalidateKeys: [['reviews']],
    success: (_d, body) => (body.status ? `Review ${body.status}` : 'Reply saved'),
    errorTitle: 'Could not update review',
    ...opts,
  });

export const useDeleteReview = (opts = {}) =>
  useAdminMutation({
    mutationFn: reviewsApi.remove,
    invalidate: [['reviews'], ['products']],
    invalidateKeys: [['reviews']],
    success: 'Review deleted',
    errorTitle: 'Could not delete review',
    ...opts,
  });
