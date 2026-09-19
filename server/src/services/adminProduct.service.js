import mongoose from 'mongoose';
import { ORDER_STATUS } from '../constants/index.js';
import { cloudinary } from '../integrations/cloudinary.js';
import {
  Brand,
  Cart,
  Category,
  Inventory,
  Order,
  Product,
  ProductVariant,
  Review,
  Wishlist,
} from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, uniqueSlug } from '../utils/helpers.js';
import { buildPagination, getPagination } from '../utils/pagination.js';
import { withTransaction } from '../utils/transaction.js';
import { recountCatalog } from './catalogStats.service.js';
import { CARD_FIELDS, toProductCards } from './productQuery.service.js';
import { syncProductAggregates } from './productSync.service.js';
import { createVariantsWithInventory, ensureSingleDefault, syncVariants } from './productVariant.service.js';
import { settingsService } from './settings.service.js';

const CLOSED_ORDER_STATUSES = [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED, ORDER_STATUS.RETURNED, ORDER_STATUS.REFUNDED];

const SCALAR_FIELDS = [
  'name',
  'shortDescription',
  'description',
  'images',
  'category',
  'subcategory',
  'brand',
  'sku',
  'taxRate',
  'attributes',
  'tags',
  'isFeatured',
  'isBestSeller',
  'isNewArrival',
  'isPublished',
  'shippingInfo',
  'returnPolicy',
  'seo',
];

const ADMIN_SORT = {
  newest: { createdAt: -1, _id: -1 },
  name: { name: 1, _id: 1 },
  'price-low': { price: 1, _id: 1 },
  'price-high': { price: -1, _id: -1 },
  stock: { stock: 1, _id: 1 },
};

const isObjectId = (v) => /^[a-f\d]{24}$/i.test(v);

async function resolveRef(Model, value) {
  if (isObjectId(value)) return new mongoose.Types.ObjectId(value);
  const doc = await Model.findOne({ slug: value.toLowerCase() }).select('_id').lean();
  return doc?._id ?? null;
}

async function assertReferences({ category, subcategory, brand }, currentCategory) {
  const [cat, sub, br] = await Promise.all([
    category ? Category.findById(category).select('_id').lean() : true,
    subcategory ? Category.findById(subcategory).select('_id parent').lean() : true,
    brand ? Brand.exists({ _id: brand }) : true,
  ]);
  if (!cat) throw AppError.badRequest('Category not found');
  if (!sub) throw AppError.badRequest('Subcategory not found');
  if (!br) throw AppError.badRequest('Brand not found');
  const parentCategory = category ?? currentCategory;
  if (subcategory && sub.parent && parentCategory && String(sub.parent) !== String(parentCategory)) {
    throw AppError.badRequest('Subcategory does not belong to the selected category');
  }
}

async function assertSlugFree(slug, excludeId) {
  if (await Product.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) })) {
    throw AppError.conflict('Slug is already in use');
  }
  return slug;
}

const collectPublicIds = (images = []) => images.map((i) => i.publicId).filter(Boolean);

export const adminProductService = {
  async list(query) {
    const { page, limit, skip } = getPagination(query);
    const and = [];
    if (query.q) {
      const regex = new RegExp(escapeRegex(query.q), 'i');
      and.push({ $or: [{ name: regex }, { sku: regex }, { tags: regex }] });
    }
    if (query.category) {
      const id = await resolveRef(Category, query.category);
      and.push({ $or: [{ category: id }, { subcategory: id }] });
    }
    if (query.brand) and.push({ brand: await resolveRef(Brand, query.brand) });
    if (query.status) and.push({ isPublished: query.status === 'published' });
    if (query.stock) {
      const { defaultLowStockThreshold: threshold = 5 } = await settingsService.get();
      const stockFilter = { in: { $gt: threshold }, low: { $gt: 0, $lte: threshold }, out: { $lte: 0 } }[query.stock];
      and.push({ stock: stockFilter });
    }
    const filter = and.length ? { $and: and } : {};
    const [products, total] = await Promise.all([
      Product.find(filter)
        .select(`${CARD_FIELDS} sku isPublished createdAt`)
        .sort(ADMIN_SORT[query.sort] ?? ADMIN_SORT.newest)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    const items = await toProductCards(products, { extra: ['sku', 'isPublished', 'createdAt'] });
    return { items, pagination: buildPagination({ page, limit, total }) };
  },

  async getById(id) {
    const product = await Product.findById(id)
      .populate([
        { path: 'category', select: 'name slug' },
        { path: 'subcategory', select: 'name slug' },
        { path: 'brand', select: 'name slug' },
      ])
      .lean();
    if (!product) throw AppError.notFound('Product not found');
    const [variants, inventories] = await Promise.all([
      ProductVariant.find({ product: id }).sort({ position: 1, createdAt: 1 }).lean(),
      Inventory.find({ product: id }).select('variant available reserved sold lowStockThreshold').lean(),
    ]);
    const invByVariant = new Map(inventories.map((inv) => [String(inv.variant), inv]));
    return {
      ...product,
      inStock: product.stock > 0,
      variantCount: variants.filter((v) => v.isActive).length,
      variants: variants.map((v) => {
        const inv = invByVariant.get(String(v._id));
        return {
          ...v,
          inStock: v.stock > 0,
          inventory: inv
            ? { _id: inv._id, available: inv.available, reserved: inv.reserved, sold: inv.sold, lowStockThreshold: inv.lowStockThreshold }
            : null,
        };
      }),
    };
  },

  async create(input, userId) {
    await assertReferences(input);
    const slug = input.slug ? await assertSlugFree(input.slug) : await uniqueSlug(Product, input.name);
    const settings = await settingsService.get();
    const lowStockThreshold = input.lowStockThreshold ?? settings.defaultLowStockThreshold ?? 5;

    const variantInputs = input.variants?.length
      ? input.variants
      : [{ sku: input.sku, price: input.price, compareAtPrice: input.compareAtPrice ?? 0, stock: input.stock ?? 0, isDefault: true }];

    const productId = await withTransaction(async (session) => {
      const doc = { createdBy: userId, slug, price: input.price, compareAtPrice: input.compareAtPrice ?? 0 };
      for (const key of SCALAR_FIELDS) if (input[key] !== undefined) doc[key] = input[key];
      const [product] = await Product.create([doc], { session });
      await createVariantsWithInventory(
        product._id,
        variantInputs.map((v, position) => ({ input: v, position })),
        { session, lowStockThreshold, userId },
      );
      await ensureSingleDefault(product._id, session);
      await syncProductAggregates(product._id, session);
      return product._id;
    });

    await recountCatalog();
    return this.getById(productId);
  },

  async update(id, input, userId) {
    const product = await Product.findById(id);
    if (!product) throw AppError.notFound('Product not found');

    await assertReferences(
      { category: input.category, subcategory: input.subcategory !== undefined ? input.subcategory : input.category && product.subcategory, brand: input.brand },
      product.category,
    );
    if (input.slug && input.slug !== product.slug) product.slug = await assertSlugFree(input.slug, id);

    const removedImages =
      input.images !== undefined
        ? collectPublicIds(product.images).filter((pid) => !collectPublicIds(input.images).includes(pid))
        : [];

    for (const key of SCALAR_FIELDS) if (input[key] !== undefined) product[key] = input[key];
    if (input.images !== undefined) product.thumbnail = input.images[0]?.url;
    const catalogChanged = ['category', 'subcategory', 'brand', 'isPublished'].some((k) => input[k] !== undefined);

    const settings = await settingsService.get();
    const lowStockThreshold = input.lowStockThreshold ?? settings.defaultLowStockThreshold ?? 5;

    await withTransaction(async (session) => {
      await product.save({ session });
      if (input.variants) {
        await syncVariants(product._id, input.variants, { session, lowStockThreshold, userId });
      } else if (input.price !== undefined || input.compareAtPrice !== undefined) {
        // Price edits without a variant list apply to single-variant products only.
        const variants = await ProductVariant.find({ product: product._id }).session(session);
        if (variants.length === 1) {
          if (input.price !== undefined) variants[0].price = input.price;
          if (input.compareAtPrice !== undefined) variants[0].compareAtPrice = input.compareAtPrice;
          await variants[0].save({ session });
        }
      }
      await syncProductAggregates(product._id, session);
    });

    removedImages.forEach((pid) => cloudinary.destroy(pid));
    if (catalogChanged) await recountCatalog();
    return this.getById(id);
  },

  async setPublished(id, isPublished) {
    const product = await Product.findById(id);
    if (!product) throw AppError.notFound('Product not found');
    product.isPublished = isPublished;
    await product.save();
    await recountCatalog();
    return this.getById(id);
  },

  async remove(id) {
    const product = await Product.findById(id).select('images').lean();
    if (!product) throw AppError.notFound('Product not found');

    const openOrder = await Order.exists({ 'items.product': product._id, status: { $nin: CLOSED_ORDER_STATUSES } });
    if (openOrder) throw AppError.conflict('This product has open orders. Unpublish it instead of deleting.');

    const variants = await ProductVariant.find({ product: product._id }).select('images').lean();
    const reviews = await Review.find({ product: product._id }).select('images').lean();

    await withTransaction(async (session) => {
      await ProductVariant.deleteMany({ product: product._id }, { session });
      await Inventory.deleteMany({ product: product._id }, { session });
      await Review.deleteMany({ product: product._id }, { session });
      await Cart.updateMany({ 'items.product': product._id }, { $pull: { items: { product: product._id } } }, { session });
      await Wishlist.updateMany({ 'items.product': product._id }, { $pull: { items: { product: product._id } } }, { session });
      await Product.deleteOne({ _id: product._id }, { session });
    });

    const publicIds = [
      ...collectPublicIds(product.images),
      ...variants.flatMap((v) => collectPublicIds(v.images)),
      ...reviews.flatMap((r) => collectPublicIds(r.images)),
    ];
    // Best effort: failures are logged by the integration.
    await Promise.allSettled(publicIds.map((pid) => cloudinary.destroy(pid)));
    await recountCatalog();
  },
};
