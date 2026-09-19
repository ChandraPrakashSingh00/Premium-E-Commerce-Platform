import { IMAGE_FOLDERS } from '../../integrations/cloudinary.js';
import { uploadService } from '../../services/upload.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../../utils/apiResponse.js';

export const uploadImages = asyncHandler(async (req, res) => {
  const folder = IMAGE_FOLDERS[req.validatedQuery.folder];
  sendCreated(res, await uploadService.uploadImages(req.files, { folder }), 'Images uploaded');
});

export const deleteImage = asyncHandler(async (req, res) => {
  await uploadService.deleteImage(req.body.publicId);
  sendSuccess(res, { message: 'Image deleted' });
});
