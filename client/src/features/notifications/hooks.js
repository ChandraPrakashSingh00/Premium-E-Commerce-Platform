import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient, queryKeys } from '@/services/queryClient';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { notificationsApi } from './api';

const LIST_PARAMS = { page: 1, limit: 20 };
const listKey = queryKeys.notifications(LIST_PARAMS);
export const POLL_INTERVAL = 60_000;

/**
 * Latest notifications + unread count. Polls every minute; TanStack Query pauses
 * interval refetches while the tab is hidden (`refetchIntervalInBackground: false`).
 */
export function useNotifications() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const query = useQuery({
    queryKey: listKey,
    queryFn: () => notificationsApi.list(LIST_PARAMS),
    enabled: isAuthenticated,
    refetchInterval: POLL_INTERVAL,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });
  return {
    ...query,
    notifications: query.data?.items ?? [],
    unreadCount: query.data?.meta?.unreadCount ?? 0,
  };
}

/** Applies an optimistic edit to the cached list; returns the snapshot for rollback. */
function patchList(updater) {
  queryClient.cancelQueries({ queryKey: listKey });
  const previous = queryClient.getQueryData(listKey);
  if (previous) queryClient.setQueryData(listKey, updater(previous));
  return { previous };
}

const rollback = (_err, _vars, context) => {
  if (context?.previous) queryClient.setQueryData(listKey, context.previous);
};
const settle = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

const withUnread = (data, items, unreadCount) => ({
  ...data,
  items,
  meta: { ...data.meta, unreadCount: Math.max(0, unreadCount) },
});

export function useMarkNotificationRead() {
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onMutate: (id) =>
      patchList((data) => {
        const target = data.items.find((n) => n._id === id);
        const wasUnread = target && !target.isRead;
        return withUnread(
          data,
          data.items.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
          (data.meta?.unreadCount ?? 0) - (wasUnread ? 1 : 0),
        );
      }),
    onError: rollback,
    onSettled: settle,
  });
}

export function useMarkAllNotificationsRead() {
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onMutate: () => patchList((data) => withUnread(data, data.items.map((n) => ({ ...n, isRead: true })), 0)),
    onError: (error, vars, context) => {
      rollback(error, vars, context);
      toast.error('Could not update notifications', error.message);
    },
    onSettled: settle,
  });
}

export function useDeleteNotification() {
  return useMutation({
    mutationFn: notificationsApi.remove,
    onMutate: (id) =>
      patchList((data) => {
        const target = data.items.find((n) => n._id === id);
        return withUnread(
          data,
          data.items.filter((n) => n._id !== id),
          (data.meta?.unreadCount ?? 0) - (target && !target.isRead ? 1 : 0),
        );
      }),
    onError: (error, vars, context) => {
      rollback(error, vars, context);
      toast.error('Could not delete notification', error.message);
    },
    onSettled: settle,
  });
}
