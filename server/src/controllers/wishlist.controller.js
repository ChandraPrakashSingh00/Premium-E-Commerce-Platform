import { wishlistService } from '../services/wishlist.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getWishlist = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await wishlistService.get(req.user._id) });
});

export const getWishlistIds = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await wishlistService.ids(req.user._id) });
});

export const addToWishlist = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await wishlistService.add(req.user._id, req.body), message: 'Added to wishlist' });
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const data = await wishlistService.remove(req.user._id, req.params.productId);
  sendSuccess(res, { data, message: 'Removed from wishlist' });
});

export const moveToCart = asyncHandler(async (req, res) => {
  const data = await wishlistService.moveToCart(req.user._id, req.params.productId, req.body ?? {});
  sendSuccess(res, { data, message: 'Moved to cart' });
});

export const mergeWishlist = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await wishlistService.merge(req.user._id, req.body.productIds), message: 'Wishlist merged' });
});
