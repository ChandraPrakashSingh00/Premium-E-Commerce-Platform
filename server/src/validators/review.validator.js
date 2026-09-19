import { z } from 'zod';
import { REVIEW_STATUS } from '../constants/index.js';
import { objectId, paginationQuery, searchText } from './common.validator.js';

const reviewImage = z.object({
  url: z.string().trim().url().max(1000),
  publicId: z.string().trim().max(300).optional(),
});

const reviewFields = {
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().min(2, 'Title is too short').max(120),
  comment: z.string().trim().min(10, 'Review must be at least 10 characters').max(3000),
  images: z.array(reviewImage).max(5, 'Maximum 5 images').optional(),
};

export const productIdParam = z.object({ productId: objectId });

export const createReviewSchema = z.object({ productId: objectId, ...reviewFields });

export const updateReviewSchema = z
  .object(reviewFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const productReviewsQuery = paginationQuery.extend({
  sort: z.enum(['recent', 'helpful', 'rating-high', 'rating-low']).default('recent'),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

export const adminReviewsQuery = paginationQuery.extend({
  status: z.enum(Object.values(REVIEW_STATUS)).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  q: searchText.optional(),
});

export const moderateReviewSchema = z
  .object({
    status: z.enum(Object.values(REVIEW_STATUS)).optional(),
    adminReply: z.string().trim().max(1000).optional(),
  })
  .refine((v) => v.status !== undefined || v.adminReply !== undefined, 'Provide status or adminReply');
