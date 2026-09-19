import { brandService } from '../../services/brand.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';

export const listBrands = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await brandService.adminList(req.validatedQuery) });
});

export const createBrand = asyncHandler(async (req, res) => {
  sendCreated(res, await brandService.create(req.body), 'Brand created');
});

export const updateBrand = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await brandService.update(req.params.id, req.body), message: 'Brand updated' });
});

export const publishBrand = asyncHandler(async (req, res) => {
  const data = await brandService.setPublished(req.params.id, req.body.isPublished);
  sendSuccess(res, { data, message: data.isPublished ? 'Brand published' : 'Brand unpublished' });
});

export const deleteBrand = asyncHandler(async (req, res) => {
  await brandService.remove(req.params.id);
  sendSuccess(res, { message: 'Brand deleted' });
});
