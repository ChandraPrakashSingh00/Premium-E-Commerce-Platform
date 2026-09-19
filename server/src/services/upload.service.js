import { cloudinary } from '../integrations/cloudinary.js';
import { AppError } from '../utils/AppError.js';

export const uploadService = {
  /**
   * Uploads in-memory multer files to Cloudinary.
   * @returns {Promise<Array<{url: string, publicId: string}>>}
   */
  async uploadImages(files, { folder, max }) {
    if (!files?.length) throw AppError.badRequest('Select at least one image');
    if (max && files.length > max) throw AppError.badRequest(`You can upload at most ${max} images`);
    if (!cloudinary.isEnabled()) throw AppError.unavailable('Image uploads are not configured');
    const uploaded = await cloudinary.uploadMany(files, { folder });
    return uploaded.map(({ url, publicId }) => ({ url, publicId }));
  },

  async deleteImage(publicId) {
    await cloudinary.destroy(publicId);
  },
};
