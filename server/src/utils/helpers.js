import crypto from 'node:crypto';

/** URL-safe slug: "Men's Running Shoe 2.0" -> "mens-running-shoe-2-0" */
export const slugify = (value) =>
  String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

/** Creates a slug that does not collide in the given model. */
export async function uniqueSlug(Model, value, excludeId) {
  const base = slugify(value) || 'item';
  let slug = base;
  for (let i = 2; ; i += 1) {
    const filter = { slug, ...(excludeId && { _id: { $ne: excludeId } }) };
    if (!(await Model.exists(filter))) return slug;
    slug = `${base}-${i}`;
  }
}

/** Money is stored in rupees with 2-decimal precision. */
export const roundMoney = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
export const toPaise = (rupees) => Math.round(Number(rupees) * 100);
export const fromPaise = (paise) => roundMoney(Number(paise) / 100);

export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('hex');
export const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

/** Constant-time string comparison. */
export const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

export const pick = (obj, keys) =>
  keys.reduce((acc, k) => {
    if (obj?.[k] !== undefined) acc[k] = obj[k];
    return acc;
  }, {});

export const isDuplicateKeyError = (err) => err?.code === 11000;
