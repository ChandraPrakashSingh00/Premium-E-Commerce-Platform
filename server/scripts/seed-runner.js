import mongoose from 'mongoose';
import { COUPON_TYPE, ROLES } from '../src/constants/index.js';
import * as models from '../src/models/index.js';
import { recountCatalog } from '../src/services/catalogStats.service.js';
import { seoService } from '../src/services/seo.service.js';
import { settingsService } from '../src/services/settings.service.js';
import { seedBrands, seedCategories, seedProducts } from './seed-catalog.js';
import { seedOrdersAndReviews } from './seed-orders.js';
import { reviewers as reviewerData } from './seed-data/reviews.js';

const { Address, Coupon, Setting, User } = models;
const DAY = 24 * 3600 * 1000;

export const seedCredentials = () => ({
  admin: {
    name: process.env.SEED_ADMIN_NAME || 'BlueMart Admin',
    email: (process.env.SEED_ADMIN_EMAIL || 'admin@bluemart.store').toLowerCase(),
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  },
  customer: {
    name: process.env.SEED_CUSTOMER_NAME || 'Priya Sharma',
    email: (process.env.SEED_CUSTOMER_EMAIL || 'customer@bluemart.store').toLowerCase(),
    password: process.env.SEED_CUSTOMER_PASSWORD || 'Customer@12345',
  },
});

async function wipeDatabase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.filter((c) => !c.collectionName.startsWith('system.')).map((c) => c.deleteMany({})));
  // Make sure indexes exist (unique constraints, text index) before inserting.
  await Promise.all(
    Object.values(models)
      .filter((m) => m?.prototype instanceof mongoose.Model)
      .map((m) => m.createIndexes()),
  );
}

function seedCoupons(adminId) {
  const now = Date.now();
  const base = { createdBy: adminId, isActive: true, startsAt: new Date(now - DAY) };
  return Coupon.create([
    {
      ...base,
      code: 'WELCOME10',
      description: '10% off your first order (up to ₹500) on orders above ₹999',
      discountType: COUPON_TYPE.PERCENTAGE,
      discountValue: 10,
      maxDiscount: 500,
      minOrderAmount: 999,
      expiresAt: new Date(now + 365 * DAY),
      perUserLimit: 1,
    },
    {
      ...base,
      code: 'FLAT500',
      description: 'Flat ₹500 off on orders above ₹4,999',
      discountType: COUPON_TYPE.FIXED,
      discountValue: 500,
      minOrderAmount: 4999,
      expiresAt: new Date(now + 180 * DAY),
      perUserLimit: 3,
    },
    {
      ...base,
      code: 'FESTIVE20',
      description: 'Festive special: 20% off (up to ₹2,000) on orders above ₹2,999',
      discountType: COUPON_TYPE.PERCENTAGE,
      discountValue: 20,
      maxDiscount: 2000,
      minOrderAmount: 2999,
      expiresAt: new Date(now + 60 * DAY),
      usageLimit: 1000,
      perUserLimit: 2,
    },
    {
      ...base,
      code: 'EXPIRED15',
      description: 'Monsoon sale: 15% off (expired)',
      discountType: COUPON_TYPE.PERCENTAGE,
      discountValue: 15,
      maxDiscount: 1000,
      minOrderAmount: 1499,
      startsAt: new Date(now - 90 * DAY),
      expiresAt: new Date(now - 30 * DAY),
    },
  ]);
}

async function seedUsers() {
  const creds = seedCredentials();
  const admin = await User.create({ ...creds.admin, role: ROLES.ADMIN, isEmailVerified: true, phone: '9900000001' });
  const customer = await User.create({
    ...creds.customer,
    role: ROLES.USER,
    isEmailVerified: true,
    phone: '9876543210',
    preferences: { newsletter: true, orderUpdates: true, promotions: true },
  });
  const customerAddress = await Address.create({
    user: customer._id,
    fullName: customer.name,
    phone: '9876543210',
    addressLine1: 'Flat 402, Prestige Lakeside Habitat',
    addressLine2: 'Varthur Main Road',
    landmark: 'Near Gunjur Lake',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560087',
    country: 'India',
    label: 'home',
    isDefault: true,
  });

  const reviewers = [];
  for (const r of reviewerData) {
    const user = await User.create({ name: r.name, email: r.email, phone: r.phone, password: creds.customer.password, isEmailVerified: true });
    const address = await Address.create({
      user: user._id,
      fullName: r.name,
      phone: r.phone,
      addressLine1: `${10 + reviewers.length * 7}, Residency Towers`,
      city: r.city,
      state: r.state,
      postalCode: r.postalCode,
      country: 'India',
      isDefault: true,
    });
    reviewers.push({ user, address });
  }
  return { admin, customer, customerAddress, reviewers, creds };
}

/**
 * Wipes the connected database and loads the demo store.
 * Expects an open mongoose connection (see scripts/seed.js).
 */
export async function runSeed({ log = () => {} } = {}) {
  log('Wiping database…');
  await wipeDatabase();
  settingsService.clearCache();

  await Setting.create({ key: 'store' });
  const { admin, customer, customerAddress, reviewers, creds } = await seedUsers();
  log(`Users: admin, customer and ${reviewers.length} reviewers`);

  const categories = await seedCategories();
  const brands = await seedBrands();
  log(`Catalogue: ${categories.size} categories, ${brands.size} brands`);

  const products = await seedProducts({ categories, brands, adminId: admin._id });
  log(`Products: ${products.length}`);

  const { orders, reviews } = await seedOrdersAndReviews({ customer, customerAddress, reviewers, products });
  log(`Orders: ${orders}, reviews: ${reviews}`);

  const coupons = await seedCoupons(admin._id);
  await recountCatalog();
  settingsService.clearCache();
  seoService.clearCache();

  return {
    counts: {
      categories: categories.size,
      brands: brands.size,
      products: products.length,
      variants: products.reduce((s, p) => s + p.variants.length, 0),
      orders,
      reviews,
      coupons: coupons.length,
      users: 2 + reviewers.length,
    },
    credentials: creds,
  };
}
