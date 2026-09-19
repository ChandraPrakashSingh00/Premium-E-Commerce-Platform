import { z } from 'zod';

/** Client mirrors of server/src/validators/{category,brand}.validator.js. */

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const imageItem = z.object({
  url: z.string().trim().url('Enter a valid image URL').max(1000),
  publicId: z.string().trim().max(300).optional(),
  alt: z.string().trim().max(200).optional(),
});

const nameField = z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name must be at most 80 characters');
const slugField = z
  .string()
  .trim()
  .toLowerCase()
  .max(120, 'Slug must be at most 120 characters')
  .refine((v) => v === '' || SLUG_RE.test(v), 'Use lowercase letters, numbers and single hyphens');
const descriptionField = z.string().trim().max(1000, 'Description must be at most 1000 characters');

const splitKeywords = (value) =>
  String(value ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

const seoForm = z.object({
  title: z.string().trim().max(70, 'SEO title must be at most 70 characters'),
  description: z.string().trim().max(170, 'SEO description must be at most 170 characters'),
  keywords: z
    .string()
    .refine((v) => splitKeywords(v).length <= 20, 'Use at most 20 keywords')
    .refine((v) => splitKeywords(v).every((k) => k.length <= 50), 'Each keyword must be at most 50 characters'),
});

export const categoryFormSchema = z.object({
  name: nameField,
  slug: slugField,
  description: descriptionField,
  image: z.array(imageItem).max(1),
  parent: z.string(),
  sortOrder: z.coerce
    .number({ error: 'Enter a number' })
    .int('Use a whole number')
    .min(0, 'Must be 0 or more')
    .max(10000, 'Must be 10000 or less'),
  isPublished: z.boolean(),
  seo: seoForm,
});

export const brandFormSchema = z.object({
  name: nameField,
  slug: slugField,
  description: descriptionField,
  logo: z.array(imageItem).max(1),
  website: z
    .string()
    .trim()
    .max(300, 'Website must be at most 300 characters')
    .refine((v) => v === '' || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), 'Enter a full URL, e.g. https://brand.com'),
  isFeatured: z.boolean(),
  isPublished: z.boolean(),
  seo: seoForm,
});

const seoDefaults = (seo = {}) => ({
  title: seo?.title ?? '',
  description: seo?.description ?? '',
  keywords: (seo?.keywords ?? []).join(', '),
});

const imageDefaults = (image) => (image?.url ? [{ url: image.url, publicId: image.publicId, alt: image.alt ?? '' }] : []);

const toSeo = (seo) => ({ title: seo.title, description: seo.description, keywords: splitKeywords(seo.keywords) });

const toImage = (images) => {
  const img = images?.[0];
  if (!img?.url) return null;
  return { url: img.url, ...(img.publicId && { publicId: img.publicId }), alt: img.alt ?? '' };
};

export const categoryDefaults = (category) => ({
  name: category?.name ?? '',
  slug: category?.slug ?? '',
  description: category?.description ?? '',
  image: imageDefaults(category?.image),
  parent: (typeof category?.parent === 'object' ? category?.parent?._id : category?.parent) ?? '',
  sortOrder: category?.sortOrder ?? 0,
  isPublished: category?.isPublished ?? true,
  seo: seoDefaults(category?.seo),
});

export const toCategoryPayload = (values) => ({
  name: values.name,
  slug: values.slug || undefined,
  description: values.description,
  image: toImage(values.image),
  parent: values.parent || null,
  sortOrder: values.sortOrder,
  isPublished: values.isPublished,
  seo: toSeo(values.seo),
});

export const brandDefaults = (brand) => ({
  name: brand?.name ?? '',
  slug: brand?.slug ?? '',
  description: brand?.description ?? '',
  logo: imageDefaults(brand?.logo),
  website: brand?.website ?? '',
  isFeatured: brand?.isFeatured ?? false,
  isPublished: brand?.isPublished ?? true,
  seo: seoDefaults(brand?.seo),
});

export const toBrandPayload = (values) => ({
  name: values.name,
  slug: values.slug || undefined,
  description: values.description,
  logo: toImage(values.logo),
  website: values.website,
  isFeatured: values.isFeatured,
  isPublished: values.isPublished,
  seo: toSeo(values.seo),
});

/** Host name for display ("https://www.nike.com/in" → "nike.com"). */
export const websiteHost = (url) => {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};
