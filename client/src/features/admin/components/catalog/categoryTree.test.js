import { buildCategoryTree, getDescendantIds, parentOptions } from './categoryTree';

const list = [
  { _id: 'shirts', name: 'Shirts', sortOrder: 1, parent: { _id: 'men', name: 'Men' } },
  { _id: 'women', name: 'Women', sortOrder: 0, parent: null },
  { _id: 'men', name: 'Men', sortOrder: 0, parent: null },
  { _id: 'tees', name: 'Tees', sortOrder: 0, parent: { _id: 'men', name: 'Men' } },
  { _id: 'polo', name: 'Polo', sortOrder: 0, parent: { _id: 'shirts', name: 'Shirts' } },
  { _id: 'orphan', name: 'Orphan', sortOrder: 0, parent: { _id: 'gone', name: 'Gone' } },
];

describe('categoryTree', () => {
  it('orders depth-first by sortOrder then name', () => {
    const rows = buildCategoryTree(list).map(({ category, depth }) => `${depth}:${category._id}`);
    expect(rows).toEqual(['0:men', '1:tees', '1:shirts', '2:polo', '0:orphan', '0:women']);
  });

  it('returns flat sorted matches when searching', () => {
    const rows = buildCategoryTree(list, { flat: true });
    expect(rows.every((r) => r.depth === 0)).toBe(true);
    expect(rows.map((r) => r.category._id).slice(0, 3)).toEqual(['men', 'orphan', 'polo']);
  });

  it('collects descendants', () => {
    expect([...getDescendantIds(list, 'men')].sort()).toEqual(['polo', 'shirts', 'tees']);
    expect(getDescendantIds(list, 'polo').size).toBe(0);
  });

  it('excludes self and descendants from parent options', () => {
    const values = parentOptions(list, 'shirts').map((o) => o.value);
    expect(values).not.toContain('shirts');
    expect(values).not.toContain('polo');
    expect(values).toContain('men');
    expect(parentOptions(list).length).toBe(list.length);
  });

  it('survives cycles', () => {
    const cyclic = [
      { _id: 'a', name: 'A', parent: { _id: 'b' } },
      { _id: 'b', name: 'B', parent: { _id: 'a' } },
    ];
    expect(buildCategoryTree(cyclic)).toHaveLength(2);
    expect([...getDescendantIds(cyclic, 'a')]).toEqual(['b']);
  });
});
