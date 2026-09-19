import { z } from 'zod';
import { USER_STATUS } from '../constants/index.js';
import { paginationQuery, searchText } from './common.validator.js';

const status = z.enum(Object.values(USER_STATUS));

export const listCustomersQuery = paginationQuery.extend({
  q: searchText.optional(),
  status: status.optional(),
  sort: z.enum(['newest', 'oldest', 'spent', 'orders', 'name']).default('newest'),
});

export const updateCustomerStatusSchema = z.object({ status });
