import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Brand, Category, Product } from '../src/models/index.js';
import { adminProductService } from '../src/services/adminProduct.service.js';
import { createProductSchema } from '../src/validators/adminProduct.validator.js';
import { brands as brandData } from './seed-data/brands.js';
import { categories as categoryData } from './seed-data/categories.js';

const dataDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed-data');
const DAY = 24 * 3600 * 1000;

/** Loads every seed-data/products-*.js module (sorted by file name). */
export async function loadProductData() {
  const files = (await readdir(dataDir)).filter((f) => /^products-.*\.js$/.test(f)).sort();
  const modules = await Promise.all(files.map((f) => import(pathToFileURL(path.join(dataDir, f)).href)));
  return modules.flatMap((m) => m.default);
}

export async function seedCategories() {
  const bySlug = new Map();
  for (const [i, { children = [], ...parent }] of categoryData.entries()) {
    const doc = await Category.create({ sortOrder: i, ...parent, isPublished: true });
    bySlug.set(doc.slug, doc);
    for (const [j, child] of children.entries()) {
      const childDoc = await Category.create({ sortOrder: j, ...child, parent: doc._id, isPublished: true });
      bySlug.set(childDoc.slug, childDoc);
    }
  }
  return bySlug;
}

export async function seedBrands() {
  const docs = await Brand.create(brandData.map((b) => ({ ...b, isPublished: true })));
  return new Map(docs.map((d) => [d.slug, d]));
}

/**
 * Creates products through the admin service (variants + inventory + initial stock
 * transactions + aggregates), then spreads createdAt so "newest" and "trending" look real.
 */
export async function seedProducts({ categories, brands, adminId }) {
  const data = await loadProductData();
  const products = [];
  for (const [i, item] of data.entries()) {
    const { category, subcategory, brand, ...rest } = item;
    const input = createProductSchema.parse({
      ...rest,
      category: String(requireRef(categories, category, item.slug)._id),
      subcategory: subcategory ? String(requireRef(categories, subcategory, item.slug)._id) : null,
      brand: String(requireRef(brands, brand, item.slug)._id),
      isPublished: item.isPublished ?? true,
    });
    const product = await adminProductService.create(input, adminId);
    const ageDays = item.isNewArrival ? 2 + (i % 12) : 20 + ((i * 37) % 260);
    const createdAt = new Date(Date.now() - ageDays * DAY);
    await Product.collection.updateOne({ _id: product._id }, { $set: { createdAt, publishedAt: createdAt } });
    products.push({ ...product, topCategorySlug: category });
  }
  return products;
}

function requireRef(map, slug, productSlug) {
  const doc = map.get(slug);
  if (!doc) throw new Error(`Seed data error: "${slug}" referenced by product "${productSlug}" does not exist`);
  return doc;
}
