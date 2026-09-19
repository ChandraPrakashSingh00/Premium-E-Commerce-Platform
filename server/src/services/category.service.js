import { Category, Product } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, uniqueSlug } from '../utils/helpers.js';
import { cloudinary } from '../integrations/cloudinary.js';
import { recountCatalog, recountCatalogSafe } from './catalogStats.service.js';

export { recountCatalog };

const PUBLIC_FIELDS = '_id name slug description image parent productCount sortOrder seo';
const bySortOrder = (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);

/** Category documents are few; load them in one query and work in memory. */
const loadAll = (filter = {}, select = PUBLIC_FIELDS) => Category.find(filter).select(select).lean();

const childrenIndex = (categories) => {
  const index = new Map();
  for (const c of categories) {
    const key = c.parent ? String(c.parent) : 'root';
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(c);
  }
  return index;
};

/** Returns ids of the given categories and all of their descendants. */
export function collectDescendantIds(rootIds, categories) {
  const index = childrenIndex(categories);
  const result = new Map();
  const stack = [...rootIds];
  while (stack.length) {
    const id = stack.pop();
    if (result.has(String(id))) continue;
    result.set(String(id), id);
    for (const child of index.get(String(id)) ?? []) stack.push(child._id);
  }
  return [...result.values()];
}

/** Ancestor chain (root first) including the category itself. */
export function buildChain(categoryId, categories) {
  const byId = new Map(categories.map((c) => [String(c._id), c]));
  const chain = [];
  let current = categoryId ? byId.get(String(categoryId)) : null;
  while (current && chain.length < 20) {
    chain.unshift(current);
    current = current.parent ? byId.get(String(current.parent)) : null;
  }
  return chain;
}

const toBreadcrumbs = (chain) => chain.map((c) => ({ name: c.name, slug: c.slug }));

function buildTree(categories) {
  const index = childrenIndex(categories);
  const build = (key, depth) =>
    (index.get(key) ?? []).sort(bySortOrder).map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image ?? null,
      productCount: c.productCount,
      children: depth < 5 ? build(String(c._id), depth + 1) : [],
    }));
  return build('root', 0);
}

export const categoryService = {
  /** Published category tree (an unpublished parent hides its subtree). */
  async getTree() {
    return buildTree(await loadAll({ isPublished: true }));
  },

  async getBySlug(slug) {
    const all = await loadAll({ isPublished: true });
    const category = all.find((c) => c.slug === slug);
    if (!category) throw AppError.notFound('Category not found');
    const chain = buildChain(category._id, all);
    const children = all
      .filter((c) => String(c.parent) === String(category._id))
      .sort(bySortOrder)
      .map(({ _id, name, slug: s, image, productCount }) => ({ _id, name, slug: s, image: image ?? null, productCount }));
    return { category, children, breadcrumbs: toBreadcrumbs(chain) };
  },

  /** Resolves a published category slug to its id plus all descendant ids (null when unknown). */
  async resolveSlugWithDescendants(slug) {
    const all = await loadAll({ isPublished: true }, '_id slug parent');
    const category = all.find((c) => c.slug === slug);
    if (!category) return null;
    return { category, ids: collectDescendantIds([category._id], all) };
  },

  async getBreadcrumbs(categoryId, subcategoryId) {
    const all = await loadAll({}, '_id name slug parent');
    const chain = buildChain(subcategoryId || categoryId, all);
    // Subcategory not under its category (legacy data): prefix the category chain.
    if (subcategoryId && categoryId && !chain.some((c) => String(c._id) === String(categoryId))) {
      return toBreadcrumbs([...buildChain(categoryId, all), ...chain]);
    }
    return toBreadcrumbs(chain);
  },

  // ---------- admin ----------

  async adminList({ q } = {}) {
    const filter = q ? { name: new RegExp(escapeRegex(q), 'i') } : {};
    const [items, all] = await Promise.all([
      Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean(),
      loadAll({}, '_id name'),
    ]);
    const names = new Map(all.map((c) => [String(c._id), c.name]));
    return items.map((c) => ({
      ...c,
      parent: c.parent ? { _id: c.parent, name: names.get(String(c.parent)) ?? null } : null,
    }));
  },

  async create(input) {
    if (input.parent) await assertExists(input.parent);
    const slug = input.slug ? await assertSlugFree(input.slug) : await uniqueSlug(Category, input.name);
    const category = await Category.create({ ...input, slug, parent: input.parent || null });
    return category.toJSON();
  },

  async update(id, input) {
    const category = await Category.findById(id);
    if (!category) throw AppError.notFound('Category not found');

    if (input.parent !== undefined) {
      const parent = input.parent || null;
      if (parent) {
        if (String(parent) === String(id)) throw AppError.badRequest('A category cannot be its own parent');
        await assertExists(parent);
        const all = await loadAll({}, '_id parent');
        const descendants = collectDescendantIds([category._id], all).map(String);
        if (descendants.includes(String(parent))) {
          throw AppError.badRequest('A category cannot be moved under one of its own subcategories');
        }
      }
      category.parent = parent;
    }
    if (input.slug && input.slug !== category.slug) category.slug = await assertSlugFree(input.slug, id);

    const previousImage = category.image?.publicId;
    for (const key of ['name', 'description', 'image', 'isPublished', 'sortOrder', 'seo']) {
      if (input[key] !== undefined) category[key] = input[key];
    }
    await category.save();
    if (previousImage && input.image !== undefined && input.image?.publicId !== previousImage) {
      cloudinary.destroy(previousImage);
    }
    if (input.parent !== undefined || input.isPublished !== undefined) await recountCatalog();
    return category.toJSON();
  },

  async setPublished(id, isPublished) {
    const category = await Category.findByIdAndUpdate(id, { $set: { isPublished } }, { returnDocument: 'after' }).lean();
    if (!category) throw AppError.notFound('Category not found');
    return category;
  },

  async remove(id) {
    const category = await Category.findById(id).lean();
    if (!category) throw AppError.notFound('Category not found');
    const [hasChildren, hasProducts] = await Promise.all([
      Category.exists({ parent: id }),
      Product.exists({ $or: [{ category: id }, { subcategory: id }] }),
    ]);
    if (hasChildren) throw AppError.conflict('Category has subcategories. Move or delete them first.');
    if (hasProducts) throw AppError.conflict('Category has products. Reassign them first.');
    await Category.deleteOne({ _id: id });
    if (category.image?.publicId) cloudinary.destroy(category.image.publicId);
    recountCatalogSafe();
  },
};

async function assertExists(id) {
  if (!(await Category.exists({ _id: id }))) throw AppError.badRequest('Parent category not found');
}

async function assertSlugFree(slug, excludeId) {
  const taken = await Category.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) });
  if (taken) throw AppError.conflict('Slug is already in use');
  return slug;
}
