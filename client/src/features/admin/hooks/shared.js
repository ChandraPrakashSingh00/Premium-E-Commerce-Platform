import { useCallback, useMemo } from 'react';
import { keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { getErrorMessage } from '@/services/apiClient';
import { queryKeys } from '@/services/queryClient';
import { toast } from '@/store/toastStore';

export const adminKey = queryKeys.admin;

/** Shared options for paginated admin lists (keeps the previous page on screen while fetching). */
export const listQueryOptions = { placeholderData: keepPreviousData, staleTime: 15_000 };

/**
 * Mutation with admin cache invalidation and toasts.
 * - `invalidate`: admin key parts, e.g. [['products'], ['dashboard']]
 * - `invalidateKeys`: full query keys outside the admin namespace
 * - `success`: string or (data, vars) => string
 * - `silentError`: skip the error toast (caller handles it)
 */
export function useAdminMutation({
  mutationFn,
  invalidate = [],
  invalidateKeys = [],
  success,
  errorTitle = 'Action failed',
  silentError = false,
  onSuccess,
  onError,
}) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: async (data, vars, ctx) => {
      const keys = [...invalidate.map((parts) => adminKey(...parts)), ...invalidateKeys];
      await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
      const message = typeof success === 'function' ? success(data, vars) : success;
      if (message) toast.success(message);
      onSuccess?.(data, vars, ctx);
    },
    onError: (error, vars, ctx) => {
      if (!silentError) toast.error(errorTitle, getErrorMessage(error));
      onError?.(error, vars, ctx);
    },
  });
}

/**
 * List filters kept in the URL so refresh / back keeps them.
 * Changing any filter other than `page` resets pagination.
 */
export function useListParams(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsKey = JSON.stringify(defaults);

  const params = useMemo(() => {
    const out = { ...JSON.parse(defaultsKey) };
    for (const [key, value] of searchParams) out[key] = value;
    out.page = Math.max(1, Number(out.page) || 1);
    return out;
  }, [searchParams, defaultsKey]);

  const setParams = useCallback(
    (updates) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') next.delete(key);
            else next.set(key, String(value));
          });
          if (!('page' in updates)) next.delete('page');
          if (next.get('page') === '1') next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setParam = useCallback((key, value) => setParams({ [key]: value }), [setParams]);
  const reset = useCallback(
    (keep = []) =>
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams();
          keep.forEach((k) => prev.has(k) && next.set(k, prev.get(k)));
          return next;
        },
        { replace: true },
      ),
    [setSearchParams],
  );
  const activeCount = [...searchParams.keys()].filter((k) => k !== 'page' && k !== 'tab').length;

  return { params, setParam, setParams, reset, activeCount };
}
