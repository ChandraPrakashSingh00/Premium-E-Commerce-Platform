import { admin } from './request';

export const uploadsApi = {
  /** Uploads files as multipart `images`; resolves to `[{ url, publicId }]`. */
  images: (files, { folder = 'products', onProgress } = {}) => {
    const form = new FormData();
    [...files].forEach((file) => form.append('images', file));
    return admin.post(`/uploads/images?folder=${encodeURIComponent(folder)}`, form, {
      timeout: 120_000,
      onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
    });
  },
  remove: (publicId) => admin.delete('/uploads/images', { data: { publicId } }),
};
