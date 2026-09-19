import { seoService } from '../services/seo.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const robotsTxt = (_req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.type('text/plain').send(seoService.robotsTxt());
};

export const sitemapXml = asyncHandler(async (_req, res) => {
  const xml = await seoService.getSitemap();
  res.set('Cache-Control', 'public, max-age=3600');
  res.type('application/xml').send(xml);
});
