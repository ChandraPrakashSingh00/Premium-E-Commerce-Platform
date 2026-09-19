import { admin } from './request';

export const dashboardApi = {
  dashboard: (range = '30d') => admin.get('/dashboard', { range }),
  analytics: (params) => admin.get('/analytics', params),
};
