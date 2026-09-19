import { PAGINATION } from '../constants/index.js';

export function getPagination({ page = 1, limit = PAGINATION.DEFAULT_LIMIT } = {}) {
  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(PAGINATION.MAX_LIMIT, Math.max(1, Number.parseInt(limit, 10) || PAGINATION.DEFAULT_LIMIT));
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

export function buildPagination({ page, limit, total }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
}

/**
 * Runs a paginated find + count in parallel.
 * @returns {Promise<{items: any[], pagination: object}>}
 */
export async function paginate(Model, filter, { page, limit, sort = { createdAt: -1 }, select, populate, lean = true } = {}) {
  const p = getPagination({ page, limit });
  let query = Model.find(filter).sort(sort).skip(p.skip).limit(p.limit);
  if (select) query = query.select(select);
  if (populate) query = query.populate(populate);
  if (lean) query = query.lean();
  const [items, total] = await Promise.all([query, Model.countDocuments(filter)]);
  return { items, pagination: buildPagination({ ...p, total }) };
}
