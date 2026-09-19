import { ORDER_STATUS, PRODUCT_SORT } from '../constants/index.js';
import { Brand, Category, Order, Product, ProductVariant } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { categoryService } from './category.service.js';
import { CARD_FIELDS, buildProductFilter, getFacets, toProductCards, wordPrefixRegex } from './productQuery.service.js';

const HOME_LIST_SIZE = 8;
const TRENDING_WINDOW_DAYS = 90;

const findCards = (filter, { sort = PRODUCT_SORT.featured, limit = HOME_LIST_SIZE, skip = 0 } = {}) =>
  Product.find(filter).select(CARD_FIELDS).sort(sort).skip(skip).limit(limit).lean();

/** Appends products from `extra` that are not already in `list`, up to `limit`. */
const fill = (list, extra, limit) => {
  const seen = new Set(list.map((p) => String(p._id)));
  for (const p of extra) {
    if (list.length >= limit) break;
    if (!seen.has(String(p._id))) {
      seen.add(String(p._id));
      list.push(p);
    }
  }
  return list;
};

async function getPublishedBySlug(slug, select) {
  const product = await Product.findOne({ slug, isPublished: true }).select(select).lean();
  if (!product) throw AppError.notFound('Product not found');
  return product;
}

export const productService = {
  async list(query) {
    const { page, limit, skip } = getPagination(query);
    const filter = await buildProductFilter(query);
    const sort = PRODUCT_SORT[query.sort] ?? PRODUCT_SORT.featured;
    const [products, total] = await Promise.all([
      findCards(filter, { sort, limit, skip }),
      Product.countDocuments(filter),
    ]);
    return { items: await toProductCards(products), pagination: buildPagination({ page, limit, total }) };
  },

  getFilters(query) {
    return getFacets(query);
  },

  async suggestions(q) {
    const regex = wordPrefixRegex(q);
    const [products, categories, brands] = await Promise.all([
      Product.find({ isPublished: true, $or: [{ name: regex }, { tags: regex }, { sku: regex }] })
        .select('name slug thumbnail images price brand')
        .sort({ soldCount: -1, ratingAverage: -1 })
        .limit(6)
        .populate({ path: 'brand', select: 'name' })
        .lean(),
      Category.find({ isPublished: true, name: regex }).select('name slug -_id').sort({ productCount: -1 }).limit(3).lean(),
      Brand.find({ isPublished: true, name: regex }).select('name slug -_id').sort({ productCount: -1 }).limit(3).lean(),
    ]);
    return {
      products: products.map((p) => ({
        _id: p._id,
        name: p.name,
        slug: p.slug,
        thumbnail: p.thumbnail ?? p.images?.[0]?.url ?? null,
        price: p.price,
        brandName: p.brand?.name ?? '',
      })),
      categories,
      brands,
    };
  },

  async home() {
    const base = { isPublished: true };
    const since = new Date(Date.now() - TRENDING_WINDOW_DAYS * 24 * 3600 * 1000);
    const trendingSort = { soldCount: -1, ratingAverage: -1, _id: -1 };

    const [featured, recentTrending, newArrivals, newest, bestSellers, topSelling] = await Promise.all([
      findCards({ ...base, isFeatured: true }, { sort: PRODUCT_SORT['best-selling'] }),
      findCards({ ...base, createdAt: { $gte: since } }, { sort: trendingSort }),
      findCards({ ...base, isNewArrival: true }, { sort: PRODUCT_SORT.newest }),
      findCards(base, { sort: PRODUCT_SORT.newest }),
      findCards({ ...base, isBestSeller: true }, { sort: PRODUCT_SORT['best-selling'] }),
      findCards(base, { sort: trendingSort }),
    ]);

    const lists = {
      featured,
      trending: fill(recentTrending, topSelling, HOME_LIST_SIZE),
      newArrivals: fill(newArrivals, newest, HOME_LIST_SIZE),
      bestSellers: fill(bestSellers, topSelling, HOME_LIST_SIZE),
    };

    // Shape every distinct product once, then map back to the lists.
    const unique = new Map();
    Object.values(lists).flat().forEach((p) => unique.set(String(p._id), p));
    const cards = new Map((await toProductCards([...unique.values()])).map((c) => [String(c._id), c]));
    return Object.fromEntries(Object.entries(lists).map(([key, list]) => [key, list.map((p) => cards.get(String(p._id)))]));
  },

  async getBySlug(slug) {
    const product = await getPublishedBySlug(slug, '-createdBy -soldCount -__v');
    const [[card], variants, subcategory, breadcrumbs] = await Promise.all([
      toProductCards([product]),
      ProductVariant.find({ product: product._id, isActive: true })
        .select('sku title price compareAtPrice size color colorHex images stock isDefault position')
        .sort({ position: 1, createdAt: 1 })
        .lean(),
      product.subcategory ? Category.findById(product.subcategory).select('name slug').lean() : null,
      categoryService.getBreadcrumbs(product.category, product.subcategory),
    ]);

    return {
      ...card,
      images: product.images,
      description: product.description,
      sku: product.sku,
      taxRate: product.taxRate,
      attributes: product.attributes ?? [],
      tags: product.tags ?? [],
      subcategory: subcategory ?? null,
      ratingBreakdown: product.ratingBreakdown ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      shippingInfo: product.shippingInfo ?? '',
      returnPolicy: product.returnPolicy ?? '',
      seo: product.seo ?? {},
      variants: variants.map(({ position: _p, ...v }) => ({ ...v, inStock: v.stock > 0 })),
      breadcrumbs,
      publishedAt: product.publishedAt,
      createdAt: product.createdAt,
    };
  },

  async related(slug, limit) {
    const product = await getPublishedBySlug(slug, '_id category subcategory brand');
    const base = { isPublished: true, _id: { $ne: product._id } };
    const sort = { soldCount: -1, ratingAverage: -1, _id: -1 };

    const sameCategory = await findCards(
      product.subcategory
        ? { ...base, $or: [{ subcategory: product.subcategory }, { category: product.category }] }
        : { ...base, category: product.category },
      { sort, limit: limit * 2 },
    );
    // Prefer same-subcategory products first.
    const list = product.subcategory
      ? [
          ...sameCategory.filter((p) => String(p.subcategory) === String(product.subcategory)),
          ...sameCategory.filter((p) => String(p.subcategory) !== String(product.subcategory)),
        ].slice(0, limit)
      : sameCategory.slice(0, limit);

    if (list.length < limit) {
      const sameBrand = await findCards(
        { ...base, brand: product.brand, _id: { $nin: [product._id, ...list.map((p) => p._id)] } },
        { sort, limit: limit - list.length },
      );
      fill(list, sameBrand, limit);
    }
    return toProductCards(list);
  },

  async frequentlyBought(slug, limit) {
    const product = await getPublishedBySlug(slug, '_id category');
    const coPurchased = await Order.aggregate([
      {
        $match: {
          'items.product': product._id,
          status: { $nin: [ORDER_STATUS.CANCELLED, ORDER_STATUS.PENDING] },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 500 },
      { $unwind: '$items' },
      { $match: { 'items.product': { $ne: product._id } } },
      { $group: { _id: '$items.product', orders: { $addToSet: '$_id' } } },
      { $project: { count: { $size: '$orders' } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: limit * 3 },
    ]);

    let list = [];
    if (coPurchased.length) {
      const ids = coPurchased.map((c) => c._id);
      const found = await findCards({ _id: { $in: ids }, isPublished: true }, { limit: ids.length });
      const byId = new Map(found.map((p) => [String(p._id), p]));
      list = ids.map((id) => byId.get(String(id))).filter(Boolean).slice(0, limit);
    }
    if (list.length < limit) {
      const fallback = await findCards(
        { isPublished: true, category: product.category, _id: { $nin: [product._id, ...list.map((p) => p._id)] } },
        { sort: PRODUCT_SORT['best-selling'], limit: limit - list.length },
      );
      fill(list, fallback, limit);
    }
    return toProductCards(list);
  },
};
