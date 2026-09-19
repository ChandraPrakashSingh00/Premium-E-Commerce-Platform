import multer from 'multer';
import { UPLOAD } from '../constants/index.js';
import { AppError } from '../utils/AppError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE, files: UPLOAD.MAX_FILES },
  fileFilter(_req, file, cb) {
    if (UPLOAD.ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
    return cb(AppError.badRequest('Only JPEG, PNG, WebP or AVIF images are allowed'));
  },
});

/** Accepts up to UPLOAD.MAX_FILES files in the `images` field (in memory; streamed to Cloudinary by the service). */
export const uploadImages = upload.array('images', UPLOAD.MAX_FILES);
export const uploadSingleImage = upload.single('image');
