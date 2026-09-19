import mongoose from 'mongoose';
import { Brand, Category, Product, ProductVariant } from '../models/index.js';
import { escapeRegex } from '../utils/helpers.js';
import { categoryService } from './category.service.js';

/** Filter that can never match (unknown category/brand slug etc.). */
const NOTHING = { _id: { $in: [] } };

/** Fields needed to render a ProductCard. */
export const CARD_FIELDS =
  'name slug thumbnail images shortDescription brand category subcategory price compareAtPrice discount ratingAverage reviewCount stock isFeatured isBestSeller isNewArrival options';

const exactCi = (values) => values.map((v) => new RegExp(`^${escapeRegex(v)}$`, 'i'));

/** Matches the start of any word: "head" matches "Wireless Headphones". */
export const wordPrefixRegex = (q) => new RegExp(`(^|[\\s\\-/(])${escapeRegex(q)}`, 'i');

/**
 * Builds the search clause for `q`: name/sku/tags prefix regex, full-text matches
 * (stemmed, for q >= 3 chars) and products whose brand or category name matches.
 */
export async function buildSearchClause(q) {
  const term = q.trim();
  if (!term) return null;
  const regex = wordPrefixRegex(term);
  const [brands, categories, textIds] = await Promise.all([
    Brand.find({ name: regex, isPublished: true }).select('_id').limit(20).lean(),
    Category.find({ name: regex, isPublished: true }).select('_id').limit(20).lean(),
    term.length >= 3
      ? Product.find({ $text: { $search: term }, isPublished: true }).select('_id').limit(500).lean()
      : Promise.resolve([]),
  ]);
  const brandIds = brands.map((b) => b._id);
  const categoryIds = categories.map((c) => c._id);
  const or = [
    { name: regex },
    { sku: new RegExp(`^${escapeRegex(term)}`, 'i') },
    { tags: new RegExp(`^${escapeRegex(term.toLowerCase())}`) },
  ];
  if (textIds.length) or.push({ _id: { $in: textIds.map((p) => p._id) } });
  if (brandIds.length) or.push({ brand: { $in: brandIds } });
  if (categoryIds.length) or.push({ category: { $in: categoryIds } }, { subcategory: { $in: categoryIds } });
  return { $or: or };
}

async function buildCategoryClause(slug) {
  const resolved = await categoryService.resolveSlugWithDescendants(slug);
  if (!resolved) return NOTHING;
  return { $or: [{ category: { $in: resolved.ids } }, { subcategory: { $in: resolved.ids } }] };
}

/**
 * Translates storefront query params into a Mongo filter (published products only).
 * `omit` skips constraints (used by facets so every option keeps its count).
 */
export async function buildProductFilter(query, { omit = [] } = {}) {
  const skip = new Set(omit);
  const and = [{ isPublished: true }];

  const [searchClause, categoryClause, brands] = await Promise.all([
    query.q ? buildSearchClause(query.q) : null,
    query.category && !skip.has('category') ? buildCategoryClause(query.category) : null,
    query.brand?.length && !skip.has('brand')
      ? Brand.find({ slug: { $in: query.brand }, isPublished: true }).select('_id').lean()
      : null,
  ]);

  if (searchClause) and.push(searchClause);
  if (categoryClause) and.push(categoryClause);
  if (brands) and.push(brands.length ? { brand: { $in: brands.map((b) => b._id) } } : NOTHING);
  if (query.ids?.length) and.push({ _id: { $in: query.ids.map((id) => new mongoose.Types.ObjectId(id)) } });

  if (!skip.has('price') && (query.minPrice !== undefined || query.maxPrice !== undefined)) {
    and.push({
      price: {
        ...(query.minPrice !== undefined && { $gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { $lte: query.maxPrice }),
      },
    });
  }
  if (query.rating) and.push({ ratingAverage: { $gte: query.rating } });
  if (query.discount) and.push({ discount: { $gte: query.discount } });
  if (query.inStock) and.push({ stock: { $gt: 0 } });
  if (query.size?.length && !skip.has('size')) and.push({ 'options.sizes': { $in: exactCi(query.size) } });
  if (query.color?.length && !skip.has('color')) and.push({ 'options.colors.name': { $in: exactCi(query.color) } });
  if (query.featured) and.push({ isFeatured: true });
  if (query.bestSeller) and.push({ isBestSeller: true });
  if (query.newArrival) and.push({ isNewArrival: true });

  return and.length === 1 ? and[0] : { $and: and };
}

/**
 * Shapes lean products (selected with CARD_FIELDS) into ProductCards.
 * Brand/category names and variant info are loaded with one query each for the whole page.
 * @param {object[]} products
 * @param {{ extra?: string[] }} [options] extra product fields to copy onto the card
 */
export async function toProductCards(products, { extra = [] } = {}) {
  if (!products.length) return [];
  const ids = products.map((p) => p._id);
  const brandIds = [...new Set(products.map((p) => String(p.brand)))];
  const categoryIds = [...new Set(products.map((p) => String(p.category)))];

  const [brands, categories, variantInfo] = await Promise.all([
    Brand.find({ _id: { $in: brandIds } }).select('name slug').lean(),
    Category.find({ _id: { $in: categoryIds } }).select('name slug').lean(),
    ProductVariant.aggregate([
      { $match: { product: { $in: ids }, isActive: true } },
      { $sort: { isDefault: -1, position: 1, createdAt: 1 } },
      { $group: { _id: '$product', defaultVariantId: { $first: '$_id' }, variantCount: { $sum: 1 } } },
    ]),
  ]);
  const brandMap = new Map(brands.map((b) => [String(b._id), b]));
  const categoryMap = new Map(categories.map((c) => [String(c._id), c]));
  const variantMap = new Map(variantInfo.map((v) => [String(v._id), v]));

  return products.map((p) => {
    const variant = variantMap.get(String(p._id));
    const card = {
      _id: p._id,
      name: p.name,
      slug: p.slug,
      thumbnail: p.thumbnail ?? p.images?.[0]?.url ?? null,
      images: (p.images ?? []).slice(0, 2).map(({ url, alt }) => ({ url, alt })),
      shortDescription: p.shortDescription ?? '',
      brand: brandMap.get(String(p.brand)) ?? null,
      category: categoryMap.get(String(p.category)) ?? null,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? 0,
      discount: p.discount ?? 0,
      ratingAverage: p.ratingAverage ?? 0,
      reviewCount: p.reviewCount ?? 0,
      stock: p.stock ?? 0,
      inStock: (p.stock ?? 0) > 0,
      isFeatured: Boolean(p.isFeatured),
      isBestSeller: Boolean(p.isBestSeller),
      isNewArrival: Boolean(p.isNewArrival),
      defaultVariantId: variant?.defaultVariantId ?? null,
      variantCount: variant?.variantCount ?? 0,
      options: { sizes: p.options?.sizes ?? [], colors: (p.options?.colors ?? []).map(({ name, hex }) => ({ name, hex })) },
    };
    for (const key of extra) card[key] = p[key];
    return card;
  });
}

const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', 'FREE SIZE', 'ONE SIZE'];
const sizeRank = (value) => {
  const idx = SIZE_ORDER.indexOf(value.toUpperCase());
  if (idx >= 0) return [0, idx];
  const num = Number.parseFloat(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(num) ? [1, num] : [2, 0];
};
const compareSizes = (a, b) => {
  const [ga, na] = sizeRank(a.value);
  const [gb, nb] = sizeRank(b.value);
  return ga - gb || na - nb || a.value.localeCompare(b.value);
};

/**
 * Facet counts for the filter sidebar. Computed on the base filter (category + q)
 * so that selecting a brand/size/colour never hides the other options.
 */
export async function getFacets(query) {
  const match = await buildProductFilter({ category: query.category, q: query.q });
  const [result] = await Product.aggregate([
    { $match: match },
    {
      $facet: {
        categories: [
          { $project: { ids: { $setUnion: [['$category'], { $cond: [{ $ifNull: ['$subcategory', false] }, ['$subcategory'], []] }] } } },
          { $unwind: '$ids' },
          { $group: { _id: '$ids', count: { $sum: 1 } } },
        ],
        brands: [{ $group: { _id: '$brand', count: { $sum: 1 } } }],
        priceRange: [{ $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }],
        sizes: [{ $unwind: '$options.sizes' }, { $group: { _id: '$options.sizes', count: { $sum: 1 } } }],
        colors: [
          { $unwind: '$options.colors' },
          {
            $group: {
              _id: { $toLower: '$options.colors.name' },
              name: { $first: '$options.colors.name' },
              hex: { $first: '$options.colors.hex' },
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1, _id: 1 } },
          { $limit: 40 },
        ],
      },
    },
  ]);

  const [categories, brands] = await Promise.all([
    Category.find({ _id: { $in: result.categories.map((c) => c._id) }, isPublished: true }).select('name slug sortOrder').lean(),
    Brand.find({ _id: { $in: result.brands.map((b) => b._id) }, isPublished: true }).select('name slug').lean(),
  ]);
  const withCount = (docs, counts) => {
    const map = new Map(counts.map((c) => [String(c._id), c.count]));
    return docs.map((d) => ({ _id: d._id, name: d.name, slug: d.slug, count: map.get(String(d._id)) ?? 0 }));
  };

  const range = result.priceRange[0];
  return {
    categories: withCount(categories, result.categories).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    brands: withCount(brands, result.brands).sort((a, b) => a.name.localeCompare(b.name)),
    priceRange: { min: range?.min ?? 0, max: range?.max ?? 0 },
    sizes: result.sizes.map((s) => ({ value: s._id, count: s.count })).sort(compareSizes),
    colors: result.colors.map((c) => ({ name: c.name, hex: c.hex ?? '', count: c.count })),
  };
}
