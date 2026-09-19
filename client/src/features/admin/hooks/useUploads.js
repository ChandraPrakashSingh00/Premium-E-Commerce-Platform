import { useMutation } from '@tanstack/react-query';
import { uploadsApi } from '../api/uploads';

/** Upload mutation; errors are surfaced by the caller (503 → add-by-URL fallback). */
export const useUploadImages = () =>
  useMutation({ mutationFn: ({ files, folder, onProgress }) => uploadsApi.images(files, { folder, onProgress }) });
