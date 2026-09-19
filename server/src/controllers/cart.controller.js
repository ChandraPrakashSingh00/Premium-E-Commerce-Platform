import { cartService } from '../services/cart.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getCart = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cartService.get(req.user._id) });
});

export const addItem = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cartService.addItem(req.user._id, req.body), message: 'Added to cart' });
});

export const updateItem = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cartService.updateItem(req.user._id, req.params.itemId, req.body.quantity), message: 'Cart updated' });
});

export const removeItem = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cartService.removeItem(req.user._id, req.params.itemId), message: 'Item removed' });
});

export const clearCart = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cartService.clear(req.user._id), message: 'Cart cleared' });
});

export const mergeCart = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cartService.merge(req.user._id, req.body.items), message: 'Cart merged' });
});

export const applyCoupon = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cartService.applyCoupon(req.user._id, req.body.code), message: 'Coupon applied' });
});

export const removeCoupon = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cartService.removeCoupon(req.user._id), message: 'Coupon removed' });
});

export const previewCart = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await cartService.preview(req.body, req.user?._id ?? null) });
});
