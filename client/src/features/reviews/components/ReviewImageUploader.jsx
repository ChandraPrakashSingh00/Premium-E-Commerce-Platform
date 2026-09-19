import { useId, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Spinner } from '@/components/ui';
import { imageUrl } from '@/utils/image';
import { useUploadReviewImages } from '../hooks';

const MAX_IMAGES = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

/**
 * Optional photo upload for reviews (POST /reviews/images).
 * Hides itself when the server reports that uploads are not configured (503).
 * Props: `value` ([{url, publicId}]), `onChange(images)`, `onBusyChange(bool)`.
 */
export function ReviewImageUploader({ value = [], onChange, onBusyChange }) {
  const inputId = useId();
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const upload = useUploadReviewImages();

  if (unavailable) {
    return value.length ? <Thumbs images={value} onRemove={(i) => onChange(value.filter((_, idx) => idx !== i))} /> : null;
  }

  const onFiles = async (fileList) => {
    setError('');
    const room = MAX_IMAGES - value.length;
    const files = [...fileList];
    const invalid = files.find((f) => !TYPES.includes(f.type) || f.size > MAX_BYTES);
    if (invalid) {
      setError('Use JPG, PNG, WEBP or AVIF images up to 5 MB each.');
      return;
    }
    if (files.length > room) setError(`You can add up to ${MAX_IMAGES} photos.`);
    const batch = files.slice(0, room);
    if (!batch.length) return;

    setPending(batch.length);
    onBusyChange?.(true);
    try {
      const uploaded = await upload.mutateAsync(batch);
      onChange([...value, ...uploaded.map(({ url, publicId }) => ({ url, publicId }))].slice(0, MAX_IMAGES));
    } catch (err) {
      if (err?.status === 503) setUnavailable(true);
      else setError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setPending(0);
      onBusyChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <p className="text-sm font-medium text-ink-800">
        Add photos <span className="font-normal text-ink-400">(optional, up to {MAX_IMAGES})</span>
      </p>
      <div className="mt-2 flex flex-wrap gap-2.5">
        <Thumbs images={value} onRemove={(i) => onChange(value.filter((_, idx) => idx !== i))} />
        {Array.from({ length: pending }, (_, i) => (
          <div key={`p-${i}`} className="flex h-20 w-20 items-center justify-center rounded-xl bg-surface">
            <Spinner className="h-5 w-5 text-ink-400" label="Uploading photo" />
          </div>
        ))}
        {value.length + pending < MAX_IMAGES && (
          <label
            htmlFor={inputId}
            className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-300 bg-surface text-ink-500 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600 focus-within:outline-2 focus-within:outline-brand-500"
          >
            <ImagePlus size={20} aria-hidden="true" />
            <span className="text-[11px] font-medium">Add</span>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={TYPES.join(',')}
              multiple
              className="sr-only"
              onChange={(e) => e.target.files?.length && onFiles(e.target.files)}
              aria-label="Upload review photos"
            />
          </label>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs font-medium text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Thumbs({ images, onRemove }) {
  return images.map((img, i) => (
    <div key={img.url} className="relative h-20 w-20 overflow-hidden rounded-xl bg-surface">
      <img src={imageUrl(img.url, 200)} alt={`Review photo ${i + 1}`} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={() => onRemove(i)}
        className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink-900/80 text-white hover:bg-ink-900"
        aria-label={`Remove photo ${i + 1}`}
      >
        <X size={14} />
      </button>
    </div>
  ));
}

export default ReviewImageUploader;
