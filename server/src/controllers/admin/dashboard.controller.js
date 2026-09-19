import { analyticsService } from '../../services/analytics.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getDashboard = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await analyticsService.dashboard(req.validatedQuery) });
});

export const getAnalytics = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await analyticsService.analytics(req.validatedQuery) });
});
