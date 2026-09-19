import { storeService } from '../services/store.service.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getPublicSettings = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  sendSuccess(res, { data: await storeService.publicSettings() });
});

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  await storeService.subscribe(req.body);
  sendSuccess(res, { message: 'Thanks for subscribing!' });
});

export const submitContact = asyncHandler(async (req, res) => {
  const result = await storeService.createContactMessage(req.body);
  sendCreated(res, result, 'Thanks for reaching out. We will get back to you shortly');
});
