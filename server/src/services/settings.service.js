import { Setting } from '../models/index.js';

const CACHE_TTL_MS = 60_000;
let cache = null;
let cachedAt = 0;

export const settingsService = {
  /** Store settings (cached in-process for 60s). */
  async get() {
    if (cache && Date.now() - cachedAt < CACHE_TTL_MS) return cache;
    const doc = await Setting.findOneAndUpdate(
      { key: 'store' },
      { $setOnInsert: { key: 'store' } },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    ).lean();
    cache = doc;
    cachedAt = Date.now();
    return doc;
  },

  async update(changes) {
    const doc = await Setting.findOneAndUpdate({ key: 'store' }, { $set: changes }, { upsert: true, returnDocument: 'after', runValidators: true }).lean();
    cache = doc;
    cachedAt = Date.now();
    return doc;
  },

  /** Public subset exposed to the storefront. */
  toPublic(s) {
    return {
      storeName: s.storeName,
      supportEmail: s.supportEmail,
      supportPhone: s.supportPhone,
      address: s.address,
      currency: s.currency,
      announcement: s.announcement,
      freeShippingThreshold: s.freeShippingThreshold,
      shippingFee: s.shippingFee,
      codEnabled: s.codEnabled,
      codFee: s.codFee,
      codMaxOrderAmount: s.codMaxOrderAmount,
      returnWindowDays: s.returnWindowDays,
      social: s.social,
    };
  },

  clearCache() {
    cache = null;
  },
};
