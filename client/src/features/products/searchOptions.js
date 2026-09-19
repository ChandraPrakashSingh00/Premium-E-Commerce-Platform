/**
 * Flattens `/products/suggestions` into a keyboard-navigable option list.
 * Order: products → categories → brands → "see all results".
 */
export function buildSearchOptions(data, term) {
  const options = [];
  (data?.products ?? []).forEach((p) => options.push({ type: 'product', key: `p-${p._id}`, href: `/product/${p.slug}`, item: p }));
  (data?.categories ?? []).forEach((c) => options.push({ type: 'category', key: `c-${c.slug}`, href: `/category/${c.slug}`, item: c }));
  (data?.brands ?? []).forEach((b) => options.push({ type: 'brand', key: `b-${b.slug}`, href: `/shop?brand=${encodeURIComponent(b.slug)}`, item: b }));
  if (term) options.push({ type: 'query', key: 'q', href: `/search?q=${encodeURIComponent(term)}`, item: { name: term } });
  return options;
}
