import { addressService } from '../services/address.service.js';
import { userService } from '../services/user.service.js';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  sendSuccess(res, { data: { user }, message: 'Profile updated' });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const user = await userService.updatePreferences(req.user.id, req.body);
  sendSuccess(res, { data: { user }, message: 'Preferences updated' });
});

export const getStats = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await userService.stats(req.user.id) });
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const result = await userService.myReviews(req.user.id, req.validatedQuery);
  sendPaginated(res, result);
});

export const listAddresses = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await addressService.list(req.user.id) });
});

export const createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.create(req.user.id, req.body);
  sendCreated(res, address, 'Address added');
});

export const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.update(req.user.id, req.params.id, req.body);
  sendSuccess(res, { data: address, message: 'Address updated' });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  await addressService.remove(req.user.id, req.params.id);
  sendSuccess(res, { message: 'Address deleted' });
});

export const setDefaultAddress = asyncHandler(async (req, res) => {
  const addresses = await addressService.setDefault(req.user.id, req.params.id);
  sendSuccess(res, { data: addresses, message: 'Default address updated' });
});
