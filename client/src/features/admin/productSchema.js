import { z } from 'zod';

/** Product form schema + pure helpers (API product ⇄ form values ⇄ ProductInput payload). */

export const TAX_RATES = [0, 5, 12, 18, 28];
export const SKU_REGEX = /^[A-Z0-9][A-Z0-9_-]*$/;
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const HEX_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
export const MAX_TAGS = 30;
export const MAX_KEYWORDS = 20;
export const MAX_IMAGES = 10;

const isBlank = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** '' / null → undefined, numeric strings → number (NaN stays NaN so zod reports it). */
const toNumber = (v) => (isBlank(v) ? undefined : typeof v === 'number' ? v : Number(v));

/** Number (or numeric string) → number, blank → undefined. */
export const num = (v) => {
  const n = toNumber(v);
  return n === undefined || Number.isNaN(n) ? undefined : n;
};

const numberError = (label) => ({
  error: (iss) => (iss.input === undefined ? `Enter ${label}` : 'Enter a valid number'),
});

const money = (label) => z.number(numberError(label)).min(0, 'Must be 0 or more').max(10_000_000, 'Too large');
const requiredMoney = (label) => z.preprocess(toNumber, money(label));
const optionalMoney = z.preprocess(toNumber, money('an amount').optional());
const optionalInt = (max) =>
  z.preprocess(toNumber, z.number(numberError('a number')).int('Whole numbers only').min(0, 'Must be 0 or more').max(max, 'Too large').optional());

const skuSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(1, 'Enter a SKU')
  .min(2, 'SKU must be at least 2 characters')
  .max(60, 'SKU must be at most 60 characters')
  .regex(SKU_REGEX, 'Use letters, numbers, - and _ only');

/** Splits "a, b, c" (or an array) into trimmed, de-duplicated (case-insensitive) values. */
export function parseList(value) {
  const parts = Array.isArray(value) ? value : String(value ?? '').split(/[,\n]/);
  const seen = new Set();
  const out = [];
  for (const raw of parts) {
    const item = String(raw ?? '').trim();
    const key = item.toLowerCase();
    if (!item || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** "Black:#111111, Navy" → [{ name: 'Black', hex: '#111111' }, { name: 'Navy', hex: '' }] */
export function parseColors(value) {
  return parseList(value).map((item) => {
    const [name, hex = ''] = item.split(':').map((s) => s.trim());
    return { name, hex: HEX_REGEX.test(hex) ? hex : '' };
  }).filter((c) => c.name);
}

const listRule = (label, max, itemMax) => (value, ctx) => {
  const items = parseList(value);
  if (items.length > max) ctx.addIssue({ code: 'custom', message: `Up to ${max} ${label}` });
  if (items.some((i) => i.length > itemMax)) ctx.addIssue({ code: 'custom', message: `Each entry must be at most ${itemMax} characters` });
};

/** Sanitised, upper-case SKU from parts: suggestSku('tee', 'M', 'Navy Blue') → 'TEE-M-NAVY-BLUE'. */
export function suggestSku(base, ...parts) {
  return [base, ...parts]
    .filter((p) => !isBlank(p))
    .join('-')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-_]+|-+$/g, '')
    .slice(0, 60);
}

/** Appends -2, -3… until `sku` is not in `taken` (a Set of upper-case SKUs). */
export function uniqueSku(sku, taken) {
  let candidate = sku;
  for (let n = 2; taken.has(candidate); n += 1) candidate = `${sku.slice(0, 56)}-${n}`;
  return candidate;
}

export const comboKey = (v) => `${String(v.size ?? '').trim().toLowerCase()}|${String(v.color ?? '').trim().toLowerCase()}`;

export const emptyVariant = (overrides = {}) => ({
  sku: '',
  size: '',
  color: '',
  colorHex: '',
  price: '',
  compareAtPrice: '',
  stock: '',
  isActive: true,
  isDefault: false,
  ...overrides,
});

/**
 * Size × colour combinations not present in `existing`, with unique suggested SKUs.
 * sizes: string | string[]; colors: string | ({name, hex} | string)[]
 */
export function buildVariantCombos({ sizes, colors, baseSku, price, existing = [] }) {
  const sizeList = parseList(sizes);
  const colorList = (typeof colors === 'string' || colors === undefined ? parseColors(colors) : colors).map((c) =>
    typeof c === 'string' ? { name: c.trim(), hex: '' } : { name: c.name ?? '', hex: c.hex ?? '' },
  );
  if (!sizeList.length && !colorList.length) return [];

  const combos = new Set(existing.map(comboKey));
  const taken = new Set(existing.map((v) => String(v.sku ?? '').trim().toUpperCase()).filter(Boolean));
  const base = suggestSku(baseSku) || 'SKU';
  const out = [];
  for (const size of sizeList.length ? sizeList : ['']) {
    for (const color of colorList.length ? colorList : [{ name: '', hex: '' }]) {
      const key = comboKey({ size, color: color.name });
      if (combos.has(key)) continue;
      combos.add(key);
      const sku = uniqueSku(suggestSku(base, size, color.name), taken);
      taken.add(sku);
      out.push(emptyVariant({ sku, size, color: color.name, colorHex: color.hex, price: isBlank(price) ? '' : String(price) }));
    }
  }
  return out;
}

/** Whole-number discount percentage, 0 when there is no discount. */
export function discountPercent(price, compareAtPrice) {
  const p = num(price);
  const c = num(compareAtPrice);
  if (p === undefined || !c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}

const variantSchema = z.object({
  _id: z.string().optional(),
  sku: skuSchema,
  size: z.string().trim().max(20, 'Max 20 characters').optional(),
  color: z.string().trim().max(40, 'Max 40 characters').optional(),
  colorHex: z.union([z.string().trim().regex(HEX_REGEX, 'Use a hex colour like #1a2b3c'), z.literal('')]).optional(),
  price: requiredMoney('a price'),
  compareAtPrice: optionalMoney,
  stock: optionalInt(1_000_000),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

const optionalText = (max) => z.string().trim().max(max, `Must be at most ${max} characters`).optional();

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(160, 'Name must be at most 160 characters'),
    slug: z.union([z.literal(''), z.string().trim().max(120, 'Max 120 characters').regex(SLUG_REGEX, 'Lowercase letters, numbers and single hyphens only')]).optional(),
    shortDescription: optionalText(300),
    description: optionalText(10000),
    images: z
      .array(z.object({ url: z.string(), publicId: z.string().optional(), alt: z.string().max(200).optional() }))
      .max(MAX_IMAGES, `Up to ${MAX_IMAGES} images`)
      .optional(),
    category: z.string({ error: 'Select a category' }).min(1, 'Select a category'),
    subcategory: z.string().nullable().optional(),
    brand: z.string({ error: 'Select a brand' }).min(1, 'Select a brand'),
    tags: z.union([z.string(), z.array(z.string())]).optional().superRefine(listRule('tags', MAX_TAGS, 40)),
    sku: skuSchema,
    price: requiredMoney('a price'),
    compareAtPrice: optionalMoney,
    taxRate: z.preprocess(toNumber, z.number().min(0).max(40).optional()),
    stock: optionalInt(1_000_000),
    lowStockThreshold: optionalInt(100_000),
    variants: z.array(variantSchema).max(100, 'Up to 100 variants').optional(),
    attributes: z
      .array(z.object({ name: z.string().trim().max(60, 'Max 60 characters'), value: z.string().trim().max(300, 'Max 300 characters') }))
      .max(50)
      .optional(),
    isPublished: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    shippingInfo: optionalText(1000),
    returnPolicy: optionalText(1000),
    seo: z
      .object({
        title: optionalText(70),
        description: optionalText(170),
        keywords: z.union([z.string(), z.array(z.string())]).optional().superRefine(listRule('keywords', MAX_KEYWORDS, 50)),
      })
      .optional(),
  })
  .superRefine((v, ctx) => {
    if (v.compareAtPrice && v.price !== undefined && v.compareAtPrice < v.price) {
      ctx.addIssue({ code: 'custom', path: ['compareAtPrice'], message: 'Compare-at price must be at least the selling price' });
    }
    (v.attributes ?? []).forEach((a, i) => {
      if (a.name && !a.value) ctx.addIssue({ code: 'custom', path: ['attributes', i, 'value'], message: 'Enter a value' });
      if (!a.name && a.value) ctx.addIssue({ code: 'custom', path: ['attributes', i, 'name'], message: 'Enter a name' });
    });
    const variants = v.variants ?? [];
    if (!variants.length) return;
    const skus = new Set();
    const combos = new Set();
    variants.forEach((variant, i) => {
      if (skus.has(variant.sku)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'sku'], message: 'Duplicate variant SKU' });
      skus.add(variant.sku);
      const key = comboKey(variant);
      if (combos.has(key)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'size'], message: 'Duplicate size/colour combination' });
      combos.add(key);
      if (variant.compareAtPrice && variant.compareAtPrice < variant.price) {
        ctx.addIssue({ code: 'custom', path: ['variants', i, 'compareAtPrice'], message: 'Must be at least the price' });
      }
    });
    if (!variants.some((variant) => variant.isActive !== false)) {
      ctx.addIssue({ code: 'custom', path: ['variants'], message: 'At least one variant must be active' });
    }
  });

/**
 * Flat admin category list (parent: {_id} | null) → depth-first options, children prefixed with "— ".
 * Orphans (parent missing from the list) are appended at top level.
 */
export function categoryTreeOptions(categories = []) {
  const byParent = new Map();
  const ids = new Set(categories.map((c) => String(c._id)));
  for (const c of categories) {
    const parentId = c.parent ? String(c.parent._id ?? c.parent) : '';
    const key = parentId && ids.has(parentId) ? parentId : '';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  }
  const out = [];
  const seen = new Set();
  const walk = (parentKey, depth) => {
    for (const c of byParent.get(parentKey) ?? []) {
      const id = String(c._id);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push({ value: id, label: `${'— '.repeat(depth)}${c.name}` });
      walk(id, depth + 1);
    }
  };
  walk('', 0);
  return out;
}

const refId = (ref) => (ref && typeof ref === 'object' ? String(ref._id ?? '') : ref ? String(ref) : '');
const str = (v) => (v === undefined || v === null ? '' : String(v));
const moneyStr = (v) => (v === undefined || v === null || Number(v) === 0 ? '' : String(v));

export const defaultProductForm = () => ({
  name: '',
  slug: '',
  shortDescription: '',
  description: '',
  images: [],
  category: '',
  subcategory: '',
  brand: '',
  tags: '',
  sku: '',
  price: '',
  compareAtPrice: '',
  taxRate: '18',
  stock: '',
  lowStockThreshold: '',
  variants: [],
  attributes: [],
  isPublished: false,
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: false,
  shippingInfo: '',
  returnPolicy: '',
  seo: { title: '', description: '', keywords: '' },
});

/**
 * A product whose only variant has no size/colour is a "simple" product: it is edited through the
 * product-level price/SKU fields and its variant is not shown in the variants editor.
 */
export const simpleVariantOf = (product) => {
  const variants = product?.variants ?? [];
  return variants.length === 1 && !variants[0].size && !variants[0].color ? variants[0] : null;
};

/** API product (GET /admin/products/:id) → form values. */
export function productToForm(product) {
  if (!product) return defaultProductForm();
  const simple = simpleVariantOf(product);
  const variants = simple ? [] : (product.variants ?? []);
  return {
    ...defaultProductForm(),
    name: str(product.name),
    slug: str(product.slug),
    shortDescription: str(product.shortDescription),
    description: str(product.description),
    images: (product.images ?? []).map(({ url, publicId, alt }) => ({ url, ...(publicId && { publicId }), alt: alt ?? '' })),
    category: refId(product.category),
    subcategory: refId(product.subcategory),
    brand: refId(product.brand),
    tags: (product.tags ?? []).join(', '),
    sku: str(product.sku),
    price: str(simple?.price ?? product.price),
    compareAtPrice: moneyStr(simple ? simple.compareAtPrice : product.compareAtPrice),
    taxRate: str(product.taxRate ?? 18),
    lowStockThreshold: str(product.variants?.[0]?.inventory?.lowStockThreshold ?? product.lowStockThreshold),
    variants: variants.map((v) => ({
      _id: String(v._id),
      sku: str(v.sku),
      size: str(v.size),
      color: str(v.color),
      colorHex: str(v.colorHex),
      price: str(v.price),
      compareAtPrice: moneyStr(v.compareAtPrice),
      stock: '',
      isActive: v.isActive !== false,
      isDefault: Boolean(v.isDefault),
      inventory: v.inventory ?? null,
    })),
    attributes: (product.attributes ?? []).map(({ name, value }) => ({ name: str(name), value: str(value) })),
    isPublished: Boolean(product.isPublished),
    isFeatured: Boolean(product.isFeatured),
    isBestSeller: Boolean(product.isBestSeller),
    isNewArrival: Boolean(product.isNewArrival),
    shippingInfo: str(product.shippingInfo),
    returnPolicy: str(product.returnPolicy),
    seo: {
      title: str(product.seo?.title),
      description: str(product.seo?.description),
      keywords: (product.seo?.keywords ?? []).join(', '),
    },
  };
}

/**
 * Form values → ProductInput. On create blank optional fields are omitted; on edit free-text fields are
 * sent as '' so they can be cleared, and subcategory '' becomes null.
 */
export function formToPayload(values, { isEdit = false } = {}) {
  const text = (v) => {
    const t = str(v).trim();
    return t ? t : isEdit ? '' : undefined;
  };
  const opt = (v) => str(v).trim() || undefined;
  const variants = values.variants ?? [];

  const payload = {
    name: str(values.name).trim(),
    slug: opt(values.slug)?.toLowerCase(),
    shortDescription: text(values.shortDescription),
    description: text(values.description),
    images: (values.images ?? []).map(({ url, publicId, alt }) => ({ url, ...(publicId && { publicId }), alt: str(alt).trim() })),
    category: values.category,
    subcategory: opt(values.subcategory) ?? (isEdit ? null : undefined),
    brand: values.brand,
    sku: str(values.sku).trim().toUpperCase(),
    price: num(values.price),
    compareAtPrice: num(values.compareAtPrice) ?? (isEdit ? 0 : undefined),
    taxRate: num(values.taxRate),
    lowStockThreshold: num(values.lowStockThreshold),
    tags: parseList(values.tags).map((t) => t.toLowerCase()),
    attributes: (values.attributes ?? [])
      .map((a) => ({ name: str(a.name).trim(), value: str(a.value).trim() }))
      .filter((a) => a.name && a.value),
    isPublished: Boolean(values.isPublished),
    isFeatured: Boolean(values.isFeatured),
    isBestSeller: Boolean(values.isBestSeller),
    isNewArrival: Boolean(values.isNewArrival),
    shippingInfo: text(values.shippingInfo),
    returnPolicy: text(values.returnPolicy),
    seo: {
      title: text(values.seo?.title),
      description: text(values.seo?.description),
      keywords: parseList(values.seo?.keywords),
    },
  };

  if (!isEdit && !variants.length) payload.stock = num(values.stock) ?? 0;

  if (variants.length) {
    const mapped = variants.map((v) => {
      const existing = Boolean(v._id);
      const blank = existing ? '' : undefined;
      const out = {
        sku: str(v.sku).trim().toUpperCase(),
        size: str(v.size).trim() || blank,
        color: str(v.color).trim() || blank,
        colorHex: str(v.colorHex).trim() || blank,
        price: num(v.price),
        compareAtPrice: num(v.compareAtPrice) ?? 0,
        isActive: v.isActive !== false,
        isDefault: Boolean(v.isDefault) && v.isActive !== false,
      };
      if (existing) out._id = v._id;
      else out.stock = num(v.stock) ?? 0;
      return out;
    });
    if (!mapped.some((v) => v.isDefault)) {
      const first = mapped.find((v) => v.isActive);
      if (first) first.isDefault = true;
    }
    payload.variants = mapped;
  }

  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
}
