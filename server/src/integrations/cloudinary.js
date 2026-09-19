import { v2 as cloudinarySdk } from 'cloudinary';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError } from '../utils/AppError.js';

let configured = false;

const ensureConfigured = () => {
  if (!env.cloudinaryEnabled) throw AppError.unavailable('Image uploads are not configured (Cloudinary credentials missing)');
  if (!configured) {
    cloudinarySdk.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
};

/** Folder names used for each asset type. */
export const IMAGE_FOLDERS = Object.freeze({ products: 'products', categories: 'categories', brands: 'brands', reviews: 'reviews', avatars: 'avatars' });

export const cloudinary = {
  isEnabled: () => env.cloudinaryEnabled,

  /**
   * Streams an in-memory file buffer to Cloudinary.
   * @returns {Promise<{url:string, publicId:string, width:number, height:number}>}
   */
  uploadBuffer(buffer, { folder }) {
    ensureConfigured();
    return new Promise((resolve, reject) => {
      const stream = cloudinarySdk.uploader.upload_stream(
        {
          folder: `${env.CLOUDINARY_FOLDER}/${folder}`,
          resource_type: 'image',
          transformation: [{ width: 2000, height: 2000, crop: 'limit' }],
          format: 'webp',
        },
        (err, result) => {
          if (err) return reject(new AppError(`Image upload failed: ${err.message}`, 502));
          return resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height });
        },
      );
      stream.end(buffer);
    });
  },

  async uploadMany(files, { folder }) {
    return Promise.all(files.map((f) => this.uploadBuffer(f.buffer, { folder })));
  },

  async destroy(publicId) {
    if (!publicId || !env.cloudinaryEnabled) return;
    ensureConfigured();
    try {
      await cloudinarySdk.uploader.destroy(publicId);
    } catch (err) {
      logger.warn({ err, publicId }, 'Failed to delete Cloudinary asset');
    }
  },

  /** Returns an optimised delivery URL for Cloudinary assets; other URLs pass through unchanged. */
  optimizedUrl(url, { width } = {}) {
    if (!url?.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', `/upload/f_auto,q_auto${width ? `,w_${width}` : ''}/`);
  },
};
