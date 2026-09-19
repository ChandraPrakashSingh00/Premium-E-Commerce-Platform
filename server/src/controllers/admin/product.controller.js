import { adminProductService } from '../../services/adminProduct.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendPaginated, sendSuccess } from '../../utils/apiResponse.js';

export const listProducts = asyncHandler(async (req, res) => {
  sendPaginated(res, await adminProductService.list(req.validatedQuery));
});

export const getProduct = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await adminProductService.getById(req.params.id) });
});

export const createProduct = asyncHandler(async (req, res) => {
  sendCreated(res, await adminProductService.create(req.body, req.user._id), 'Product created');
});

export const updateProduct = asyncHandler(async (req, res) => {
  const data = await adminProductService.update(req.params.id, req.body, req.user._id);
  sendSuccess(res, { data, message: 'Product updated' });
});

export const publishProduct = asyncHandler(async (req, res) => {
  const data = await adminProductService.setPublished(req.params.id, req.body.isPublished);
  sendSuccess(res, { data, message: data.isPublished ? 'Product published' : 'Product unpublished' });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await adminProductService.remove(req.params.id);
  sendSuccess(res, { message: 'Product deleted' });
});
