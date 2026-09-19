import { http } from '@/services/apiClient';

export const notificationsApi = {
  /** Paginated list with `meta.unreadCount`. */
  list: (params) => http.get('/notifications', params),
  markRead: (id) => http.patch(`/notifications/${id}/read`),
  markAllRead: () => http.patch('/notifications/read-all'),
  remove: (id) => http.delete(`/notifications/${id}`),
};
