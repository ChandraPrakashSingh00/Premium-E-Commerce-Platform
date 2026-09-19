import { Brand, Product } from '../models/index.js';
import { AppError } from '../utils/AppError.js';
import { escapeRegex, uniqueSlug } from '../utils/helpers.js';
import { cloudinary } from '../integrations/cloudinary.js';

const PUBLIC_FIELDS = '_id name slug logo description website productCount isFeatured seo';

async function assertSlugFree(slug, excludeId) {
  const taken = await Brand.exists({ slug, ...(excludeId && { _id: { $ne: excludeId } }) });
  if (taken) throw AppError.conflict('Slug is already in use');
  return slug;
}

export const brandService = {
  list() {
    return Brand.find({ isPublished: true }).select(PUBLIC_FIELDS).sort({ isFeatured: -1, name: 1 }).lean();
  },

  async getBySlug(slug) {
    const brand = await Brand.findOne({ slug, isPublished: true }).select(PUBLIC_FIELDS).lean();
    if (!brand) throw AppError.notFound('Brand not found');
    return brand;
  },

  // ---------- admin ----------

  adminList({ q } = {}) {
    const filter = q ? { name: new RegExp(escapeRegex(q), 'i') } : {};
    return Brand.find(filter).sort({ name: 1 }).lean();
  },

  async create(input) {
    const slug = input.slug ? await assertSlugFree(input.slug) : await uniqueSlug(Brand, input.name);
    const brand = await Brand.create({ ...input, slug });
    return brand.toJSON();
  },

  async update(id, input) {
    const brand = await Brand.findById(id);
    if (!brand) throw AppError.notFound('Brand not found');
    if (input.slug && input.slug !== brand.slug) brand.slug = await assertSlugFree(input.slug, id);
    const previousLogo = brand.logo?.publicId;
    for (const key of ['name', 'description', 'logo', 'website', 'isPublished', 'isFeatured', 'seo']) {
      if (input[key] !== undefined) brand[key] = input[key];
    }
    await brand.save();
    if (previousLogo && input.logo !== undefined && input.logo?.publicId !== previousLogo) cloudinary.destroy(previousLogo);
    return brand.toJSON();
  },

  async setPublished(id, isPublished) {
    const brand = await Brand.findByIdAndUpdate(id, { $set: { isPublished } }, { returnDocument: 'after' }).lean();
    if (!brand) throw AppError.notFound('Brand not found');
    return brand;
  },

  async remove(id) {
    const brand = await Brand.findById(id).lean();
    if (!brand) throw AppError.notFound('Brand not found');
    if (await Product.exists({ brand: id })) throw AppError.conflict('Brand is used by products. Reassign them first.');
    await Brand.deleteOne({ _id: id });
    if (brand.logo?.publicId) cloudinary.destroy(brand.logo.publicId);
  },
};
