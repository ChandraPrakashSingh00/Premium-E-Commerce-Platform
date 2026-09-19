import { Router } from 'express';
import {
  getFrequentlyBought,
  getHomeProducts,
  getProduct,
  getProductFilters,
  getRelatedProducts,
  getSuggestions,
  listProducts,
} from '../controllers/product.controller.js';
import { validate } from '../middleware/validate.js';
import { slugParam } from '../validators/common.validator.js';
import { productFiltersQuery, productListQuery, relatedQuery, suggestionsQuery } from '../validators/product.validator.js';

const router = Router();

// Static paths must be registered before /:slug.
router.get('/', validate({ query: productListQuery }), listProducts);
router.get('/filters', validate({ query: productFiltersQuery }), getProductFilters);
router.get('/suggestions', validate({ query: suggestionsQuery }), getSuggestions);
router.get('/home', getHomeProducts);
router.get('/:slug', validate({ params: slugParam }), getProduct);
router.get('/:slug/related', validate({ params: slugParam, query: relatedQuery }), getRelatedProducts);
router.get('/:slug/frequently-bought', validate({ params: slugParam, query: relatedQuery }), getFrequentlyBought);

export default router;
