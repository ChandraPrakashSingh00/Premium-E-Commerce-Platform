import { Brand, Category, Product } from '../models/index.js';
import { logger } from '../config/logger.js';

/**
 * Recomputes Category.productCount and Brand.productCount from published products.
 * A category counts every published product assigned to it or to any of its descendants
 * (via `category` or `subcategory`). Categories are few, so ancestry is resolved in memory.
 */
export async function recountCatalog() {
  const [groups, brandGroups, categories, brands] = await Promise.all([
    Product.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: { category: '$category', subcategory: '$subcategory' }, count: { $sum: 1 } } },
    ]),
    Product.aggregate([{ $match: { isPublished: true } }, { $group: { _id: '$brand', count: { $sum: 1 } } }]),
    Category.find().select('_id parent productCount').lean(),
    Brand.find().select('_id productCount').lean(),
  ]);

  const parentOf = new Map(categories.map((c) => [String(c._id), c.parent ? String(c.parent) : null]));
  const counts = new Map();
  for (const { _id, count } of groups) {
    // Collect the distinct set of categories this group belongs to (incl. ancestors).
    const touched = new Set();
    for (const start of [_id.category, _id.subcategory]) {
      let id = start ? String(start) : null;
      for (let depth = 0; id && !touched.has(id) && depth < 20; depth += 1) {
        touched.add(id);
        id = parentOf.get(id) ?? null;
      }
    }
    for (const id of touched) counts.set(id, (counts.get(id) ?? 0) + count);
  }

  const categoryOps = categories
    .filter((c) => (counts.get(String(c._id)) ?? 0) !== c.productCount)
    .map((c) => ({ updateOne: { filter: { _id: c._id }, update: { $set: { productCount: counts.get(String(c._id)) ?? 0 } } } }));

  const brandCounts = new Map(brandGroups.map((g) => [String(g._id), g.count]));
  const brandOps = brands
    .filter((b) => (brandCounts.get(String(b._id)) ?? 0) !== b.productCount)
    .map((b) => ({ updateOne: { filter: { _id: b._id }, update: { $set: { productCount: brandCounts.get(String(b._id)) ?? 0 } } } }));

  await Promise.all([
    categoryOps.length ? Category.bulkWrite(categoryOps) : null,
    brandOps.length ? Brand.bulkWrite(brandOps) : null,
  ]);
}

/** Fire-and-forget variant for request paths where counts are not needed in the response. */
export function recountCatalogSafe() {
  return recountCatalog().catch((err) => logger.warn({ err }, 'Failed to recount catalogue stats'));
}
