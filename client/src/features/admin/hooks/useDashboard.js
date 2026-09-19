import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';
import { adminKey } from './shared';

export const useDashboard = (range) =>
  useQuery({
    queryKey: adminKey('dashboard', range),
    queryFn: () => dashboardApi.dashboard(range),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });

export const useAnalytics = (params) =>
  useQuery({
    queryKey: adminKey('analytics', params),
    queryFn: () => dashboardApi.analytics(params),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
