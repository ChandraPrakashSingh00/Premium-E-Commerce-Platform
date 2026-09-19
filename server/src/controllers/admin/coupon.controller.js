import { couponService } from '../../services/coupon.service.js';
import { sendCreated, sendPaginated, sendSuccess } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const listCoupons = asyncHandler(async (req, res) => {
  sendPaginated(res, await couponService.adminList(req.validatedQuery));
});

export const getCoupon = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await couponService.adminGet(req.params.id) });
});

export const createCoupon = asyncHandler(async (req, res) => {
  sendCreated(res, await couponService.create(req.body, req.user._id), 'Coupon created');
});

export const updateCoupon = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await couponService.update(req.params.id, req.body), message: 'Coupon updated' });
});

export const setCouponStatus = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await couponService.setStatus(req.params.id, req.body.isActive), message: 'Coupon updated' });
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.remove(req.params.id);
  sendSuccess(res, { message: 'Coupon deleted' });
});
