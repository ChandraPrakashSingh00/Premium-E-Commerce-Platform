import { categoryService } from '../services/category.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getCategoryTree = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  sendSuccess(res, { data: await categoryService.getTree() });
});

export const getCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await categoryService.getBySlug(req.params.slug) });
});
