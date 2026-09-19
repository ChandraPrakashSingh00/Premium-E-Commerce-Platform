/** Pure helpers for the flat admin category list (`parent: {_id, name} | null`). */

const parentId = (category) => {
  const p = category?.parent;
  if (!p) return null;
  return typeof p === 'object' ? (p._id ?? null) : p;
};

const compare = (a, b) =>
  (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0) || String(a.name ?? '').localeCompare(String(b.name ?? ''), undefined, { sensitivity: 'base' });

/**
 * Depth-first ordered rows `[{ category, depth }]`, siblings sorted by sortOrder then name.
 * Categories whose parent is missing from the list are treated as roots (orphans stay visible).
 * With `flat: true` (e.g. while searching) matches are returned sorted, all at depth 0.
 */
export function buildCategoryTree(list = [], { flat = false } = {}) {
  const items = Array.isArray(list) ? list : [];
  if (flat) return [...items].sort(compare).map((category) => ({ category, depth: 0 }));

  const ids = new Set(items.map((c) => c._id));
  const children = new Map();
  items.forEach((c) => {
    const pid = parentId(c);
    const key = pid && ids.has(pid) ? pid : null;
    if (!children.has(key)) children.set(key, []);
    children.get(key).push(c);
  });
  children.forEach((arr) => arr.sort(compare));

  const out = [];
  const seen = new Set();
  const walk = (key, depth) => {
    (children.get(key) ?? []).forEach((category) => {
      if (seen.has(category._id)) return; // guards against cycles in bad data
      seen.add(category._id);
      out.push({ category, depth });
      walk(category._id, depth + 1);
    });
  };
  walk(null, 0);
  // Anything unreachable (a cycle) is appended at the root so nothing disappears.
  items.forEach((category) => !seen.has(category._id) && out.push({ category, depth: 0 }));
  return out;
}

/** Ids of every descendant of `id` (not including `id`). */
export function getDescendantIds(list = [], id) {
  const result = new Set();
  if (!id) return result;
  const byParent = new Map();
  list.forEach((c) => {
    const pid = parentId(c);
    if (!pid) return;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid).push(c._id);
  });
  const stack = [...(byParent.get(id) ?? [])];
  while (stack.length) {
    const next = stack.pop();
    if (result.has(next) || next === id) continue;
    result.add(next);
    stack.push(...(byParent.get(next) ?? []));
  }
  return result;
}

/** `<Select>` options for the parent field: indented tree, excluding `excludeId` and its descendants. */
export function parentOptions(list = [], excludeId) {
  const blocked = getDescendantIds(list, excludeId);
  if (excludeId) blocked.add(excludeId);
  return buildCategoryTree(list)
    .filter(({ category }) => !blocked.has(category._id))
    .map(({ category, depth }) => ({ value: category._id, label: `${'   '.repeat(depth)}${depth ? '└ ' : ''}${category.name}` }));
}

export { parentId as getParentId };
