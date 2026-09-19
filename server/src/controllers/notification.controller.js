import { notificationService } from '../services/notification.service.js';
import { sendPaginated, sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { items, pagination, unreadCount } = await notificationService.list(req.user.id, req.validatedQuery);
  sendPaginated(res, { items, pagination, meta: { unreadCount } });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.user.id, req.params.id);
  sendSuccess(res, { data: notification });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllRead(req.user.id);
  sendSuccess(res, { data: result, message: 'All notifications marked as read' });
});

export const removeNotification = asyncHandler(async (req, res) => {
  await notificationService.remove(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Notification deleted' });
});
