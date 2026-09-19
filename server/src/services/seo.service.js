import { env } from '../config/env.js';
import { Brand, Category, Product } from '../models/index.js';

const CACHE_TTL_MS = 60 * 60 * 1000;
let cached = null;
let cachedAt = 0;

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/shop', changefreq: 'daily', priority: '0.9' },
  { path: '/about', changefreq: 'monthly', priority: '0.5' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/faq', changefreq: 'monthly', priority: '0.4' },
  { path: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/terms', changefreq: 'yearly', priority: '0.3' },
  { path: '/refund-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/shipping-policy', changefreq: 'yearly', priority: '0.3' },
];

const DISALLOWED = ['/account', '/checkout', '/admin', '/cart'];

export const xmlEscape = (value) =>
  String(value).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

const urlEntry = ({ loc, lastmod, changefreq, priority }) =>
  [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString()}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');

/** Builds the sitemap XML from the database (URLs point at the storefront). */
export async function buildSitemapXml({ baseUrl = env.clientUrl } = {}) {
  const base = String(baseUrl).replace(/\/$/, '');
  const [categories, products, brands] = await Promise.all([
    Category.find({ isPublished: true }).select('slug updatedAt').lean(),
    Product.find({ isPublished: true }).select('slug updatedAt').sort({ updatedAt: -1 }).limit(45_000).lean(),
    Brand.find({ isPublished: true }).select('slug updatedAt').lean(),
  ]);

  const entries = [
    ...STATIC_PAGES.map((p) => ({ loc: `${base}${p.path}`, changefreq: p.changefreq, priority: p.priority })),
    ...categories.map((c) => ({
      loc: `${base}/category/${encodeURIComponent(c.slug)}`,
      lastmod: c.updatedAt,
      changefreq: 'weekly',
      priority: '0.8',
    })),
    ...products.map((p) => ({
      loc: `${base}/product/${encodeURIComponent(p.slug)}`,
      lastmod: p.updatedAt,
      changefreq: 'weekly',
      priority: '0.7',
    })),
    ...brands.map((b) => ({
      loc: `${base}/shop?brand=${encodeURIComponent(b.slug)}`,
      lastmod: b.updatedAt,
      changefreq: 'weekly',
      priority: '0.6',
    })),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(urlEntry),
    '</urlset>',
    '',
  ].join('\n');
}

export const seoService = {
  /** Sitemap cached in memory for one hour. */
  async getSitemap() {
    if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached;
    cached = await buildSitemapXml();
    cachedAt = Date.now();
    return cached;
  },

  clearCache() {
    cached = null;
  },

  robotsTxt() {
    return [
      'User-agent: *',
      'Allow: /',
      ...DISALLOWED.map((p) => `Disallow: ${p}`),
      '',
      `Sitemap: ${env.SERVER_URL.replace(/\/$/, '')}/sitemap.xml`,
      '',
    ].join('\n');
  },
};
