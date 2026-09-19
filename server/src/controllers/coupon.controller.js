import { couponService } from '../services/coupon.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listAvailableCoupons = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await couponService.listAvailable() });
});
