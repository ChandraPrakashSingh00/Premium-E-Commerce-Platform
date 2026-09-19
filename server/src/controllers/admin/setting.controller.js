import { storeService } from '../../services/store.service.js';
import { sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getSettings = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await storeService.getSettings() });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await storeService.updateSettings(req.body);
  sendSuccess(res, { data: settings, message: 'Settings updated' });
});

export const listMessages = asyncHandler(async (req, res) => {
  sendPaginated(res, await storeService.listMessages(req.validatedQuery));
});

export const updateMessage = asyncHandler(async (req, res) => {
  const message = await storeService.updateMessageStatus(req.params.id, req.body.status);
  sendSuccess(res, { data: message, message: 'Message updated' });
});
