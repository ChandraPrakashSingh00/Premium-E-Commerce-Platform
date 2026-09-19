import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, createAdmin, createProduct, createUser, loginAs } from './helpers.js';
import {
  Brand,
  Category,
  Inventory,
  InventoryTransaction,
  Order,
  Product,
  ProductVariant,
  Review,
} from '../src/models/index.js';
import { syncProductAggregates } from '../src/services/productSync.service.js';

const api = request(app);

const productInput = (category, brand, overrides = {}) => ({
  name: 'Linen Summer Shirt',
  description: 'Breathable pure linen shirt for warm days.',
  images: [{ url: 'https://example.com/shirt.jpg', alt: 'Shirt' }],
  category: String(category._id),
  brand: String(brand._id),
  sku: 'LIN-SHIRT',
  price: 1999,
  compareAtPrice: 2999,
  taxRate: 12,
  isPublished: true,
  variants: [
    { sku: 'LIN-SHIRT-M-WHT', size: 'M', color: 'White', colorHex: '#ffffff', price: 1999, compareAtPrice: 2999, stock: 5 },
    { sku: 'LIN-SHIRT-L-WHT', size: 'L', color: 'White', colorHex: '#ffffff', price: 2099, compareAtPrice: 2999, stock: 0 },
    { sku: 'LIN-SHIRT-M-BLU', size: 'M', color: 'Blue', colorHex: '#1e3a8a', price: 1899, compareAtPrice: 2499, stock: 7 },
  ],
  ...overrides,
});

describe('public product listing', () => {
  let fx;

  beforeEach(async () => {
    const men = await Category.create({ name: 'Men', slug: 'men' });
    const shirts = await Category.create({ name: 'Shirts', slug: 'men-shirts', parent: men._id });
    const women = await Category.create({ name: 'Women', slug: 'women' });
    const acme = await Brand.create({ name: 'Acme Wear', slug: 'acme' });
    const zen = await Brand.create({ name: 'Zenith', slug: 'zenith' });

    const a = await createProduct({ name: 'Classic Oxford Shirt', slug: 'oxford', category: men, brand: acme, price: 1500, variants: [{ size: 'M', color: 'Blue', stock: 4 }] });
    await Product.updateOne({ _id: a.product._id }, { subcategory: shirts._id, tags: ['formal'] });
    // Child-only product: category points at the subcategory itself.
    const b = await createProduct({ name: 'Denim Overshirt', slug: 'denim', category: shirts, brand: zen, price: 3200, variants: [{ size: 'L', color: 'Indigo', stock: 0 }] });
    const c = await createProduct({ name: 'Floral Wrap Dress', slug: 'dress', category: women, brand: acme, price: 2500, variants: [{ size: 'S', color: 'Red', stock: 3 }] });
    const hidden = await createProduct({ name: 'Draft Shirt', slug: 'draft', category: men, brand: acme, isPublished: false });
    fx = { men, shirts, women, acme, zen, a, b, c, hidden };
  });

  it('lists only published products with ProductCard shape', async () => {
    const res = await api.get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(3);
    const card = res.body.data.items.find((p) => p.slug === 'oxford');
    expect(card).toMatchObject({
      name: 'Classic Oxford Shirt',
      brand: { name: 'Acme Wear', slug: 'acme' },
      category: { name: 'Men', slug: 'men' },
      inStock: true,
      variantCount: 1,
      options: { sizes: ['M'] },
    });
    expect(card.defaultVariantId).toBe(String(fx.a.variants[0]._id));
    expect(card.images.length).toBeLessThanOrEqual(2);
  });

  it('filters by category including descendants', async () => {
    const res = await api.get('/api/v1/products?category=men');
    expect(res.body.data.items.map((p) => p.slug).sort()).toEqual(['denim', 'oxford']);
    const child = await api.get('/api/v1/products?category=men-shirts');
    expect(child.body.data.items.map((p) => p.slug).sort()).toEqual(['denim', 'oxford']);
    const unknown = await api.get('/api/v1/products?category=nope');
    expect(unknown.body.data.items).toEqual([]);
  });

  it('filters by brand, price range, stock, size and colour', async () => {
    let res = await api.get('/api/v1/products?brand=zenith');
    expect(res.body.data.items.map((p) => p.slug)).toEqual(['denim']);
    res = await api.get('/api/v1/products?brand=acme,zenith&minPrice=1600&maxPrice=3000');
    expect(res.body.data.items.map((p) => p.slug)).toEqual(['dress']);
    res = await api.get('/api/v1/products?inStock=true');
    expect(res.body.data.items.map((p) => p.slug).sort()).toEqual(['dress', 'oxford']);
    res = await api.get('/api/v1/products?size=m,s');
    expect(res.body.data.items.map((p) => p.slug).sort()).toEqual(['dress', 'oxford']);
    res = await api.get('/api/v1/products?color=indigo');
    expect(res.body.data.items.map((p) => p.slug)).toEqual(['denim']);
    res = await api.get(`/api/v1/products?ids=${fx.a.product._id},${fx.hidden.product._id}`);
    expect(res.body.data.items.map((p) => p.slug)).toEqual(['oxford']);
    res = await api.get('/api/v1/products?ids=notanid');
    expect(res.status).toBe(422);
  });

  it('sorts by price and paginates', async () => {
    const res = await api.get('/api/v1/products?sort=price-low&limit=2&page=1');
    expect(res.body.data.items.map((p) => p.price)).toEqual([1500, 2500]);
    expect(res.body.data.pagination).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2, hasNextPage: true });
    const page2 = await api.get('/api/v1/products?sort=price-low&limit=2&page=2');
    expect(page2.body.data.items.map((p) => p.price)).toEqual([3200]);
  });

  it('searches by name prefix, tags, brand and category names', async () => {
    let res = await api.get('/api/v1/products?q=oxf');
    expect(res.body.data.items.map((p) => p.slug)).toEqual(['oxford']);
    res = await api.get('/api/v1/products?q=wrap');
    expect(res.body.data.items.map((p) => p.slug)).toEqual(['dress']);
    res = await api.get('/api/v1/products?q=zenith');
    expect(res.body.data.items.map((p) => p.slug)).toEqual(['denim']);
    res = await api.get('/api/v1/products?q=formal');
    expect(res.body.data.items.map((p) => p.slug)).toEqual(['oxford']);
    res = await api.get('/api/v1/products?q=shirts');
    expect(res.body.data.items.map((p) => p.slug).sort()).toEqual(['denim', 'oxford']);
  });

  it('returns facets, suggestions and home lists', async () => {
    const facets = await api.get('/api/v1/products/filters?category=men');
    expect(facets.status).toBe(200);
    expect(facets.body.data.brands.map((b) => [b.slug, b.count])).toEqual([
      ['acme', 1],
      ['zenith', 1],
    ]);
    expect(facets.body.data.priceRange).toEqual({ min: 1500, max: 3200 });
    expect(facets.body.data.sizes.map((s) => s.value)).toEqual(['M', 'L']);
    expect(facets.body.data.colors.map((c) => c.name).sort()).toEqual(['Blue', 'Indigo']);
    expect(facets.body.data.categories.find((c) => c.slug === 'men-shirts').count).toBe(2);

    const sugg = await api.get('/api/v1/products/suggestions?q=de');
    expect(sugg.body.data.products.map((p) => p.slug)).toEqual(['denim']);
    expect(sugg.body.data.products[0].brandName).toBe('Zenith');
    expect((await api.get('/api/v1/products/suggestions?q=d')).status).toBe(422);

    const home = await api.get('/api/v1/products/home');
    expect(Object.keys(home.body.data).sort()).toEqual(['bestSellers', 'featured', 'newArrivals', 'trending']);
    expect(home.body.data.trending).toHaveLength(3);
  });

  it('returns product detail with breadcrumbs and 404 for unpublished', async () => {
    const res = await api.get('/api/v1/products/oxford');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      slug: 'oxford',
      subcategory: { slug: 'men-shirts' },
      breadcrumbs: [
        { name: 'Men', slug: 'men' },
        { name: 'Shirts', slug: 'men-shirts' },
      ],
    });
    expect(res.body.data.variants).toHaveLength(1);
    expect(res.body.data.variants[0]).toMatchObject({ size: 'M', inStock: true });
    expect((await api.get('/api/v1/products/draft')).status).toBe(404);
    expect((await api.get('/api/v1/products/missing')).status).toBe(404);
  });

  it('returns related and frequently bought products', async () => {
    const related = await api.get('/api/v1/products/oxford/related');
    expect(related.status).toBe(200);
    const slugs = related.body.data.map((p) => p.slug);
    expect(slugs).not.toContain('oxford');
    expect(slugs).toContain('dress'); // same brand fill
    expect(slugs).not.toContain('draft');

    const user = await createUser();
    const item = (p, v) => ({ product: p._id, variant: v._id, name: p.name, slug: p.slug, sku: v.sku, price: 100, quantity: 1, lineSubtotal: 100, lineTotal: 100 });
    await Order.create({
      orderNumber: 'ORD-TEST-1',
      user: user._id,
      items: [item(fx.a.product, fx.a.variants[0]), item(fx.c.product, fx.c.variants[0])],
      contact: { name: 'A', email: 'a@example.com', phone: '9876543210' },
      shippingAddress: { fullName: 'A', phone: '9876543210', addressLine1: 'x', city: 'y', state: 'z', postalCode: '560001' },
      pricing: { subtotal: 200, total: 200 },
      paymentMethod: 'cod',
      status: 'delivered',
    });
    const fbt = await api.get('/api/v1/products/oxford/frequently-bought?limit=2');
    expect(fbt.body.data[0].slug).toBe('dress');
  });
});

describe('categories and brands (public)', () => {
  it('returns the published tree and category detail', async () => {
    const men = await Category.create({ name: 'Men', slug: 'men', sortOrder: 1 });
    await Category.create({ name: 'Shirts', slug: 'men-shirts', parent: men._id });
    await Category.create({ name: 'Hidden', slug: 'hidden', isPublished: false });
    await Brand.create({ name: 'Acme', slug: 'acme' });

    const tree = await api.get('/api/v1/categories');
    expect(tree.body.data).toHaveLength(1);
    expect(tree.body.data[0].children[0].slug).toBe('men-shirts');

    const detail = await api.get('/api/v1/categories/men-shirts');
    expect(detail.body.data.breadcrumbs.map((b) => b.slug)).toEqual(['men', 'men-shirts']);
    expect((await api.get('/api/v1/categories/hidden')).status).toBe(404);

    const brands = await api.get('/api/v1/brands');
    expect(brands.body.data.map((b) => b.slug)).toEqual(['acme']);
    expect((await api.get('/api/v1/brands/acme')).status).toBe(200);
  });
});

describe('admin products', () => {
  let admin;
  let category;
  let brand;

  beforeEach(async () => {
    admin = await loginAs(await createAdmin());
    category = await Category.create({ name: 'Men', slug: 'men' });
    brand = await Brand.create({ name: 'Acme', slug: 'acme' });
  });

  it('rejects non-admin users', async () => {
    const user = await loginAs(await createUser());
    expect((await user.get('/api/v1/admin/products')).status).toBe(403);
    expect((await user.post('/api/v1/admin/products').send(productInput(category, brand))).status).toBe(403);
    expect((await api.get('/api/v1/admin/products')).status).toBe(401);
  });

  it('creates a product with variants, inventory and aggregates', async () => {
    const res = await admin.post('/api/v1/admin/products').send(productInput(category, brand));
    expect(res.status).toBe(201);
    const p = res.body.data;
    expect(p.slug).toBe('linen-summer-shirt');
    expect(p.price).toBe(1899);
    expect(p.compareAtPrice).toBe(2499);
    expect(p.discount).toBe(24);
    expect(p.stock).toBe(12);
    expect(p.options.sizes).toEqual(['M', 'L']);
    expect(p.options.colors.map((c) => c.name)).toEqual(['White', 'Blue']);
    expect(p.variants).toHaveLength(3);
    expect(p.variants.filter((v) => v.isDefault)).toHaveLength(1);
    expect(p.variants[0].inventory).toMatchObject({ available: 5, reserved: 0, sold: 0 });

    expect(await Inventory.countDocuments({ product: p._id })).toBe(3);
    const txns = await InventoryTransaction.find({ product: p._id }).lean();
    expect(txns).toHaveLength(2);
    expect(txns.every((t) => t.type === 'ADJUSTMENT' && t.reason === 'Initial stock')).toBe(true);

    expect((await Category.findById(category._id)).productCount).toBe(1);
    expect((await Brand.findById(brand._id)).productCount).toBe(1);

    const dup = await admin.post('/api/v1/admin/products').send(productInput(category, brand, { name: 'Another' }));
    expect(dup.status).toBe(409);
  });

  it('creates a default variant for single-SKU products', async () => {
    const res = await admin
      .post('/api/v1/admin/products')
      .send(productInput(category, brand, { variants: undefined, stock: 9, sku: 'mug-1', name: 'Mug' }));
    expect(res.status).toBe(201);
    expect(res.body.data.variants).toHaveLength(1);
    expect(res.body.data.variants[0]).toMatchObject({ sku: 'MUG-1', isDefault: true, stock: 9 });
    expect(res.body.data.stock).toBe(9);
  });

  it('validates input', async () => {
    const res = await admin.post('/api/v1/admin/products').send({ name: 'x' });
    expect(res.status).toBe(422);
    const bad = await admin.post('/api/v1/admin/products').send(
      productInput(category, brand, {
        variants: [
          { sku: 'A-1', size: 'M', price: 10 },
          { sku: 'A-2', size: 'M', price: 10 },
        ],
      }),
    );
    expect(bad.status).toBe(422);
  });

  it('updates variants without touching existing stock', async () => {
    const created = (await admin.post('/api/v1/admin/products').send(productInput(category, brand))).body.data;
    const [white, whiteL, blue] = created.variants;
    // Give one variant order history so it is deactivated instead of deleted.
    const user = await createUser();
    await Order.create({
      orderNumber: 'ORD-TEST-2',
      user: user._id,
      items: [{ product: created._id, variant: whiteL._id, name: 'x', slug: 'x', sku: whiteL.sku, price: 1, quantity: 1, lineSubtotal: 1, lineTotal: 1 }],
      contact: { name: 'A', email: 'a@example.com', phone: '9876543210' },
      shippingAddress: { fullName: 'A', phone: '9876543210', addressLine1: 'x', city: 'y', state: 'z', postalCode: '560001' },
      pricing: { subtotal: 1, total: 1 },
      paymentMethod: 'cod',
      status: 'delivered',
    });

    const res = await admin.patch(`/api/v1/admin/products/${created._id}`).send({
      name: 'Linen Shirt v2',
      variants: [
        { _id: white._id, sku: white.sku, size: 'M', color: 'White', price: 1799, compareAtPrice: 2999, stock: 999 },
        { sku: 'LIN-SHIRT-XL-WHT', size: 'XL', color: 'White', price: 2199, stock: 4 },
      ],
    });
    expect(res.status).toBe(200);
    const updated = res.body.data;
    expect(updated.slug).toBe('linen-summer-shirt'); // slug is stable
    expect(updated.name).toBe('Linen Shirt v2');
    const byId = Object.fromEntries(updated.variants.map((v) => [v.sku, v]));
    expect(byId[white.sku]).toMatchObject({ price: 1799, stock: 5, isActive: true });
    expect(byId[whiteL.sku]).toMatchObject({ isActive: false });
    expect(byId['LIN-SHIRT-XL-WHT']).toMatchObject({ stock: 4, isActive: true });
    expect(await ProductVariant.exists({ _id: blue._id })).toBeNull();
    expect(await Inventory.exists({ variant: blue._id })).toBeNull();
    expect(updated.price).toBe(1799);
    expect(updated.stock).toBe(9);
    expect(updated.options.colors.map((c) => c.name)).toEqual(['White']);

    // Price-only update on a multi-variant product leaves aggregates driven by variants.
    const again = await admin.patch(`/api/v1/admin/products/${created._id}`).send({ price: 5 });
    expect(again.body.data.price).toBe(1799);
  });

  it('lists, publishes and guards deletion', async () => {
    const created = (await admin.post('/api/v1/admin/products').send(productInput(category, brand))).body.data;
    const list = await admin.get('/api/v1/admin/products?status=published&stock=in&q=linen');
    expect(list.status).toBe(200);
    expect(list.body.data.items[0]).toMatchObject({ sku: 'LIN-SHIRT', isPublished: true, variantCount: 3 });

    const unpub = await admin.patch(`/api/v1/admin/products/${created._id}/publish`).send({ isPublished: false });
    expect(unpub.body.data.isPublished).toBe(false);
    expect((await Category.findById(category._id)).productCount).toBe(0);

    const user = await createUser();
    const order = await Order.create({
      orderNumber: 'ORD-TEST-3',
      user: user._id,
      items: [{ product: created._id, variant: created.variants[0]._id, name: 'x', slug: 'x', sku: 'X', price: 1, quantity: 1, lineSubtotal: 1, lineTotal: 1 }],
      contact: { name: 'A', email: 'a@example.com', phone: '9876543210' },
      shippingAddress: { fullName: 'A', phone: '9876543210', addressLine1: 'x', city: 'y', state: 'z', postalCode: '560001' },
      pricing: { subtotal: 1, total: 1 },
      paymentMethod: 'cod',
      status: 'processing',
    });
    expect((await admin.delete(`/api/v1/admin/products/${created._id}`)).status).toBe(409);

    await Order.updateOne({ _id: order._id }, { status: 'delivered' });
    await Review.create({ product: created._id, user: user._id, rating: 5, title: 'Great', comment: 'Really great shirt!' });
    const del = await admin.delete(`/api/v1/admin/products/${created._id}`);
    expect(del.status).toBe(200);
    expect(await Product.exists({ _id: created._id })).toBeNull();
    expect(await ProductVariant.countDocuments({ product: created._id })).toBe(0);
    expect(await Inventory.countDocuments({ product: created._id })).toBe(0);
    expect(await Review.countDocuments({ product: created._id })).toBe(0);
  });

  it('syncProductAggregates mirrors inventory into variants and product', async () => {
    const { product, variants } = await createProduct({ variants: [{ size: 'S', stock: 2 }, { size: 'M', stock: 3 }] });
    await Inventory.updateOne({ variant: variants[0]._id }, { available: 10 });
    await syncProductAggregates([product._id]);
    expect((await Product.findById(product._id)).stock).toBe(13);
    expect((await ProductVariant.findById(variants[0]._id)).stock).toBe(10);
  });
});

describe('admin categories and brands', () => {
  it('creates, prevents cycles and guards deletion', async () => {
    const admin = await loginAs(await createAdmin());
    const parent = (await admin.post('/api/v1/admin/categories').send({ name: 'Home & Living' })).body.data;
    expect(parent.slug).toBe('home-living');
    const child = (await admin.post('/api/v1/admin/categories').send({ name: 'Decor', parent: parent._id })).body.data;

    const cycle = await admin.patch(`/api/v1/admin/categories/${parent._id}`).send({ parent: child._id });
    expect(cycle.status).toBe(400);
    expect((await admin.patch(`/api/v1/admin/categories/${parent._id}`).send({ parent: parent._id })).status).toBe(400);

    const list = await admin.get('/api/v1/admin/categories');
    expect(list.body.data.find((c) => c._id === child._id).parent).toMatchObject({ name: 'Home & Living' });

    expect((await admin.delete(`/api/v1/admin/categories/${parent._id}`)).status).toBe(409);
    expect((await admin.delete(`/api/v1/admin/categories/${child._id}`)).status).toBe(200);

    const brand = (await admin.post('/api/v1/admin/brands').send({ name: 'Kora Living', isFeatured: true })).body.data;
    expect(brand.slug).toBe('kora-living');
    await createProduct({ category: await Category.findById(parent._id), brand: await Brand.findById(brand._id) });
    expect((await admin.delete(`/api/v1/admin/brands/${brand._id}`)).status).toBe(409);
    expect((await admin.delete(`/api/v1/admin/categories/${parent._id}`)).status).toBe(409);
    const pub = await admin.patch(`/api/v1/admin/brands/${brand._id}/publish`).send({ isPublished: false });
    expect(pub.body.data.isPublished).toBe(false);
  });
});

describe('seo', () => {
  it('serves robots.txt and sitemap.xml', async () => {
    const robots = await api.get('/robots.txt');
    expect(robots.text).toContain('Disallow: /checkout');
    expect(robots.text).toMatch(/Sitemap: .*\/sitemap\.xml/);
    const { seoService } = await import('../src/services/seo.service.js');
    seoService.clearCache();
    await createProduct({ slug: 'tee-&-co' });
    const sitemap = await api.get('/sitemap.xml');
    expect(sitemap.status).toBe(200);
    expect(sitemap.headers['content-type']).toContain('xml');
    expect(sitemap.text).toContain('/product/tee-%26-co');
    expect(sitemap.text).toContain('/privacy-policy');
    expect(sitemap.headers['cache-control']).toContain('max-age=3600');
  });
});
