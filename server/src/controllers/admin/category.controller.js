import { categoryService } from '../../services/category.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';

export const listCategories = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await categoryService.adminList(req.validatedQuery) });
});

export const createCategory = asyncHandler(async (req, res) => {
  sendCreated(res, await categoryService.create(req.body), 'Category created');
});

export const updateCategory = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await categoryService.update(req.params.id, req.body), message: 'Category updated' });
});

export const publishCategory = asyncHandler(async (req, res) => {
  const data = await categoryService.setPublished(req.params.id, req.body.isPublished);
  sendSuccess(res, { data, message: data.isPublished ? 'Category published' : 'Category unpublished' });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.remove(req.params.id);
  sendSuccess(res, { message: 'Category deleted' });
});
