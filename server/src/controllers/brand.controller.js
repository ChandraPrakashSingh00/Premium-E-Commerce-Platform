import { brandService } from '../services/brand.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const listBrands = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  sendSuccess(res, { data: await brandService.list() });
});

export const getBrand = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await brandService.getBySlug(req.params.slug) });
});
