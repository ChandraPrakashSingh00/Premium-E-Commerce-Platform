import request from 'supertest';
import { createApp } from '../src/app.js';
import { ROLES } from '../src/constants/index.js';
import { Address, Brand, Category, Inventory, Product, ProductVariant, User } from '../src/models/index.js';

export const app = createApp();

export const PASSWORD = 'Password123';

let seq = 0;
const next = () => {
  seq += 1;
  return seq;
};

export async function createUser(overrides = {}) {
  const n = next();
  return User.create({
    name: `Test User ${n}`,
    email: `user${n}@example.com`,
    password: PASSWORD,
    isEmailVerified: true,
    ...overrides,
  });
}

export const createAdmin = (overrides = {}) => createUser({ role: ROLES.ADMIN, ...overrides });

/** Returns a supertest agent that carries the auth cookies of the given user. */
export async function loginAs(user, password = PASSWORD) {
  const agent = request.agent(app);
  const path = user.role === ROLES.ADMIN ? '/api/v1/auth/admin/login' : '/api/v1/auth/login';
  const res = await agent.post(path).send({ email: user.email, password });
  if (res.status !== 200) throw new Error(`Login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

/**
 * Creates a published product with variants and matching Inventory documents.
 * @param {{price?:number, compareAtPrice?:number, variants?: Array<{size?:string,color?:string,stock:number,price?:number}>, taxRate?:number}} opts
 */
export async function createProduct(opts = {}) {
  const n = next();
  const category = opts.category ?? (await Category.create({ name: `Category ${n}`, slug: `category-${n}` }));
  const brand = opts.brand ?? (await Brand.create({ name: `Brand ${n}`, slug: `brand-${n}` }));
  const price = opts.price ?? 1000;
  const variantsInput = opts.variants ?? [{ stock: 10 }];

  const product = await Product.create({
    name: opts.name ?? `Product ${n}`,
    slug: opts.slug ?? `product-${n}`,
    sku: `SKU-${n}`,
    price,
    compareAtPrice: opts.compareAtPrice ?? price * 1.25,
    taxRate: opts.taxRate ?? 18,
    category: category._id,
    brand: brand._id,
    images: [{ url: `https://example.com/p${n}.jpg`, alt: 'image' }],
    isPublished: opts.isPublished ?? true,
    options: {
      sizes: [...new Set(variantsInput.map((v) => v.size).filter(Boolean))],
      colors: [...new Set(variantsInput.map((v) => v.color).filter(Boolean))].map((name) => ({ name, hex: '#000000' })),
    },
    stock: variantsInput.reduce((s, v) => s + v.stock, 0),
  });

  const variants = [];
  for (const [i, v] of variantsInput.entries()) {
    const variant = await ProductVariant.create({
      product: product._id,
      sku: `SKU-${n}-${i}`,
      price: v.price ?? price,
      compareAtPrice: product.compareAtPrice,
      size: v.size,
      color: v.color,
      stock: v.stock,
      isDefault: i === 0,
    });
    await Inventory.create({ variant: variant._id, product: product._id, sku: variant.sku, available: v.stock });
    variants.push(variant);
  }
  return { product, variants, category, brand };
}

export function createAddress(user, overrides = {}) {
  return Address.create({
    user: user._id,
    fullName: user.name,
    phone: '9876543210',
    addressLine1: '221B Residency Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560025',
    country: 'India',
    isDefault: true,
    ...overrides,
  });
}
