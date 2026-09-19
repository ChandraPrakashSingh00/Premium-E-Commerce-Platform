import { productService } from '../services/product.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPaginated, sendSuccess } from '../utils/apiResponse.js';

export const listProducts = asyncHandler(async (req, res) => {
  sendPaginated(res, await productService.list(req.validatedQuery));
});

export const getProductFilters = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await productService.getFilters(req.validatedQuery) });
});

export const getSuggestions = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await productService.suggestions(req.validatedQuery.q) });
});

export const getHomeProducts = asyncHandler(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  sendSuccess(res, { data: await productService.home() });
});

export const getProduct = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await productService.getBySlug(req.params.slug) });
});

export const getRelatedProducts = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await productService.related(req.params.slug, req.validatedQuery.limit) });
});

export const getFrequentlyBought = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await productService.frequentlyBought(req.params.slug, req.validatedQuery.limit) });
});
