import { z } from 'zod';

export const DASHBOARD_RANGES = ['7d', '30d', '90d', '12m'];

export const dashboardQuery = z.object({
  range: z.enum(DASHBOARD_RANGES).default('30d'),
});

export const analyticsQuery = z
  .object({
    from: z.coerce.date({ error: 'Invalid from date' }).optional(),
    to: z.coerce.date({ error: 'Invalid to date' }).optional(),
    granularity: z.enum(['day', 'week', 'month']).default('day'),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, { path: ['from'], message: '"from" must be before "to"' });
