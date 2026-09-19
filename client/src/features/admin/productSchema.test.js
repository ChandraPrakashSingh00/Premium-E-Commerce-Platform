import {
  buildVariantCombos,
  defaultProductForm,
  discountPercent,
  formToPayload,
  parseColors,
  parseList,
  productFormSchema,
  productToForm,
  suggestSku,
} from './productSchema';

const CAT = '64b000000000000000000001';
const BRAND = '64b000000000000000000002';

const valid = (overrides = {}) => ({
  ...defaultProductForm(),
  name: 'Linen Shirt',
  category: CAT,
  brand: BRAND,
  sku: 'ln-shirt',
  price: '1299',
  ...overrides,
});

const issuesFor = (values) => {
  const result = productFormSchema.safeParse(values);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('productFormSchema', () => {
  it('accepts a valid minimal product and normalises values', () => {
    const result = productFormSchema.safeParse(valid());
    expect(result.success).toBe(true);
    expect(result.data.sku).toBe('LN-SHIRT');
    expect(result.data.price).toBe(1299);
    expect(result.data.compareAtPrice).toBeUndefined();
  });

  it('requires category, brand and sku', () => {
    const issues = issuesFor(valid({ category: '', brand: '', sku: '' }));
    expect(issues.category).toBe('Select a category');
    expect(issues.brand).toBe('Select a brand');
    expect(issues.sku).toBeDefined();
  });

  it('rejects malformed SKUs', () => {
    expect(issuesFor(valid({ sku: 'bad sku!' })).sku).toMatch(/letters, numbers/);
    expect(issuesFor(valid({ sku: '-ABC' })).sku).toBeDefined();
  });

  it('requires a numeric price', () => {
    expect(issuesFor(valid({ price: '' })).price).toBe('Enter a price');
    expect(issuesFor(valid({ price: 'abc' })).price).toBe('Enter a valid number');
  });

  it('rejects compareAtPrice below price', () => {
    expect(issuesFor(valid({ compareAtPrice: '999' })).compareAtPrice).toMatch(/at least/);
    expect(productFormSchema.safeParse(valid({ compareAtPrice: '1499' })).success).toBe(true);
  });

  it('validates variants: duplicate SKUs, combos, compare-at and at least one active', () => {
    const v = { sku: 'A-1', size: 'M', color: 'Red', colorHex: '', price: '10', compareAtPrice: '5', stock: '', isActive: false };
    const issues = issuesFor(valid({ variants: [v, { ...v, compareAtPrice: '' }] }));
    expect(issues['variants.1.sku']).toBe('Duplicate variant SKU');
    expect(issues['variants.1.size']).toMatch(/Duplicate size/);
    expect(issues['variants.0.compareAtPrice']).toBeDefined();
    expect(issues.variants).toMatch(/active/);
  });

  it('limits SEO lengths and tag count', () => {
    const issues = issuesFor(valid({ seo: { title: 'x'.repeat(71), description: 'y'.repeat(171), keywords: '' }, tags: Array.from({ length: 31 }, (_, i) => `t${i}`).join(',') }));
    expect(issues['seo.title']).toBeDefined();
    expect(issues['seo.description']).toBeDefined();
    expect(issues.tags).toBeDefined();
  });
});

describe('list helpers', () => {
  it('parses comma lists and colours', () => {
    expect(parseList(' S, m ,S,, L ')).toEqual(['S', 'm', 'L']);
    expect(parseColors('Black:#111111, Navy, Bad:#zz')).toEqual([
      { name: 'Black', hex: '#111111' },
      { name: 'Navy', hex: '' },
      { name: 'Bad', hex: '' },
    ]);
  });

  it('suggests sanitised SKUs and computes discounts', () => {
    expect(suggestSku('tee', 'M', 'Navy Blue')).toBe('TEE-M-NAVY-BLUE');
    expect(discountPercent(750, 1000)).toBe(25);
    expect(discountPercent('1000', '900')).toBe(0);
    expect(discountPercent(100, '')).toBe(0);
  });
});

describe('buildVariantCombos', () => {
  it('yields sizes × colours with unique SKUs and the product price', () => {
    const combos = buildVariantCombos({ sizes: 'S, M', colors: 'Red:#ff0000, Blue', baseSku: 'tee', price: '499' });
    expect(combos).toHaveLength(4);
    expect(combos.map((c) => c.sku)).toEqual(['TEE-S-RED', 'TEE-S-BLUE', 'TEE-M-RED', 'TEE-M-BLUE']);
    expect(combos[0]).toMatchObject({ size: 'S', color: 'Red', colorHex: '#ff0000', price: '499', isActive: true });
    expect(new Set(combos.map((c) => c.sku)).size).toBe(4);
  });

  it('skips existing combos and avoids existing SKUs', () => {
    const existing = [
      { sku: 'TEE-S-RED', size: 's', color: 'red' },
      { sku: 'TEE-M-RED', size: 'L', color: 'Green' },
    ];
    const combos = buildVariantCombos({ sizes: ['S', 'M'], colors: [{ name: 'Red', hex: '' }], baseSku: 'TEE', price: 10, existing });
    expect(combos).toHaveLength(1);
    expect(combos[0]).toMatchObject({ size: 'M', color: 'Red', sku: 'TEE-M-RED-2' });
  });

  it('works with only one dimension and returns nothing without input', () => {
    expect(buildVariantCombos({ sizes: 'S,M', colors: '', baseSku: 'X1' }).map((c) => c.sku)).toEqual(['X1-S', 'X1-M']);
    expect(buildVariantCombos({ sizes: '', colors: '', baseSku: 'X1' })).toEqual([]);
  });
});

describe('productToForm / formToPayload', () => {
  const apiProduct = {
    _id: 'p1',
    name: 'Tee',
    slug: 'tee',
    category: { _id: CAT, name: 'Men' },
    subcategory: null,
    brand: { _id: BRAND, name: 'Acme' },
    sku: 'TEE',
    price: 499,
    compareAtPrice: 0,
    tags: ['cotton', 'summer'],
    images: [{ url: 'https://x/y.jpg', publicId: 'y', alt: '' }],
    isPublished: true,
    seo: { keywords: ['tee'] },
    variants: [
      { _id: 'v1', sku: 'TEE-S', size: 'S', color: '', price: 499, compareAtPrice: 0, isActive: true, isDefault: true, inventory: { available: 3, reserved: 1 } },
      { _id: 'v2', sku: 'TEE-M', size: 'M', color: '', price: 499, compareAtPrice: 599, isActive: true, isDefault: false, inventory: null },
    ],
  };

  it('maps populated references to ids', () => {
    const form = productToForm(apiProduct);
    expect(form).toMatchObject({ category: CAT, brand: BRAND, subcategory: '', tags: 'cotton, summer', compareAtPrice: '' });
    expect(form.variants).toHaveLength(2);
    expect(form.variants[1].compareAtPrice).toBe('599');
  });

  it('omits stock for existing variants and includes it for new ones', () => {
    const form = productToForm(apiProduct);
    form.variants[0].stock = '50';
    form.variants.push({ sku: 'tee-l', size: 'L', color: '', colorHex: '', price: '499', compareAtPrice: '', stock: '7', isActive: true, isDefault: false });
    const payload = formToPayload(form, { isEdit: true });
    expect(payload.variants[0]).toMatchObject({ _id: 'v1', sku: 'TEE-S' });
    expect(payload.variants[0]).not.toHaveProperty('stock');
    expect(payload.variants[2]).toMatchObject({ sku: 'TEE-L', stock: 7 });
    expect(payload.variants[2]).not.toHaveProperty('_id');
    expect(payload).not.toHaveProperty('stock');
    expect(payload.subcategory).toBeNull();
    expect(payload.tags).toEqual(['cotton', 'summer']);
  });

  it('builds a create payload without blank optionals', () => {
    const payload = formToPayload(valid({ stock: '12', tags: 'Summer, SALE', slug: '' }));
    expect(payload).toMatchObject({ sku: 'LN-SHIRT', price: 1299, stock: 12, taxRate: 18, tags: ['summer', 'sale'] });
    expect(payload).not.toHaveProperty('slug');
    expect(payload).not.toHaveProperty('subcategory');
    expect(payload).not.toHaveProperty('compareAtPrice');
    expect(payload).not.toHaveProperty('variants');
  });

  it('treats a single option-less variant as a simple product', () => {
    const simple = { ...apiProduct, variants: [{ _id: 'v9', sku: 'TEE', price: 450, compareAtPrice: 500, isActive: true, isDefault: true }] };
    const form = productToForm(simple);
    expect(form.variants).toEqual([]);
    expect(form).toMatchObject({ price: '450', compareAtPrice: '500' });
    const payload = formToPayload(form, { isEdit: true });
    expect(payload).not.toHaveProperty('variants');
    expect(payload).not.toHaveProperty('stock');
    expect(payload).toMatchObject({ price: 450, compareAtPrice: 500 });
  });
});
