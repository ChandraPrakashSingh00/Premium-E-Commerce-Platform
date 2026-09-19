import { useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Trash2, UploadCloud } from 'lucide-react';
import { Button, SmartImage } from '@/components/ui';
import { getErrorMessage } from '@/services/apiClient';
import { toast } from '@/store/toastStore';
import { cn } from '@/utils/cn';
import { useUploadImages } from '../hooks/useUploads';

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_PER_REQUEST = 8;

function UrlForm({ onAdd, disabled }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const id = useId();
  const submit = () => {
    try {
      const parsed = new URL(url.trim());
      if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad');
      onAdd(parsed.toString());
      setUrl('');
      setError('');
    } catch {
      setError('Enter a valid http(s) image URL');
    }
  };
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-ink-600">
        Add image by URL
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          value={url}
          disabled={disabled}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="https://…"
          aria-invalid={error ? true : undefined}
          className="h-10 min-w-0 flex-1 rounded-lg border border-line px-3 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none"
        />
        <Button size="sm" variant="secondary" onClick={submit} disabled={disabled || !url.trim()} className="h-10">
          Add
        </Button>
      </div>
      {error && (
        <p className="text-xs text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ImageTile({ image, index, count, onMove, onRemove, onAlt, primaryLabel }) {
  const altId = useId();
  return (
    <li className="group overflow-hidden rounded-xl border border-line bg-white">
      <div className="relative">
        <SmartImage src={image.url} alt={image.alt || ''} width={320} aspect="1 / 1" />
        {index === 0 && primaryLabel && (
          <span className="absolute top-2 left-2 rounded-md bg-ink-900/85 px-1.5 py-0.5 text-[11px] font-semibold text-white">{primaryLabel}</span>
        )}
        <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <div className="flex gap-1">
            {count > 1 && (
              <>
                <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} className="rounded-md bg-white/95 p-1.5 text-ink-700 shadow-sm disabled:opacity-40" aria-label={`Move image ${index + 1} left`}>
                  <ArrowLeft size={14} />
                </button>
                <button type="button" onClick={() => onMove(index, 1)} disabled={index === count - 1} className="rounded-md bg-white/95 p-1.5 text-ink-700 shadow-sm disabled:opacity-40" aria-label={`Move image ${index + 1} right`}>
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>
          <button type="button" onClick={() => onRemove(index)} className="rounded-md bg-white/95 p-1.5 text-danger-600 shadow-sm" aria-label={`Remove image ${index + 1}`}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <label className="sr-only" htmlFor={altId}>
        Alt text for image {index + 1}
      </label>
      <input
        id={altId}
        value={image.alt ?? ''}
        maxLength={200}
        onChange={(e) => onAlt(index, e.target.value)}
        placeholder="Alt text"
        className="w-full border-t border-line px-2.5 py-2 text-xs placeholder:text-ink-400 focus:bg-brand-50/40 focus:outline-none"
      />
    </li>
  );
}

/**
 * Image manager: drag & drop / click upload to Cloudinary via the API, reorder, remove, alt text.
 * value: [{ url, publicId?, alt }]. With `multiple={false}` it manages a single image (still an array).
 * When uploads are unavailable (503) images can be added by URL instead.
 */
export function ImageUploader({ value = [], onChange, folder = 'products', multiple = true, max = 10, label = 'Images', hint, error, primaryLabel = 'Cover' }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(null);
  const [uploadsDown, setUploadsDown] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const upload = useUploadImages();
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const limit = multiple ? max : 1;
  const remaining = Math.max(0, limit - value.length);
  const full = remaining === 0;

  // Uploads are async: read the latest value so edits made meanwhile are kept.
  const add = (images) => onChange(multiple ? [...valueRef.current, ...images].slice(0, limit) : images.slice(0, 1));

  const handleFiles = async (fileList) => {
    const files = [...fileList];
    const valid = files.filter((f) => ACCEPT.includes(f.type) && f.size <= MAX_SIZE);
    if (valid.length < files.length) toast.error('Some files were skipped', 'Use JPEG, PNG, WebP or AVIF images up to 5 MB.');
    const batch = valid.slice(0, Math.min(multiple ? remaining || limit : 1, MAX_PER_REQUEST));
    if (!batch.length) return;
    setProgress(0);
    try {
      const uploaded = await upload.mutateAsync({ files: batch, folder, onProgress: setProgress });
      add(uploaded.map((img) => ({ url: img.url, publicId: img.publicId, alt: '' })));
    } catch (err) {
      if (err?.status === 503) {
        setUploadsDown(true);
        setShowUrl(true);
      } else {
        toast.error('Upload failed', getErrorMessage(err));
      }
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const move = (index, dir) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(index + dir, 0, item);
    onChange(next);
  };
  const remove = (index) => onChange(value.filter((_, i) => i !== index));
  const setAlt = (index, alt) => onChange(value.map((img, i) => (i === index ? { ...img, alt } : img)));
  const busy = progress !== null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-ink-800">{label}</p>
        <button type="button" onClick={() => setShowUrl((v) => !v)} className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
          <Link2 size={13} aria-hidden="true" /> {showUrl ? 'Hide URL input' : 'Add by URL'}
        </button>
      </div>

      {value.length > 0 && (
        <ul className={cn('grid gap-3', multiple ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'max-w-[200px] grid-cols-1')}>
          {value.map((img, i) => (
            <ImageTile key={`${img.url}-${i}`} image={img} index={i} count={value.length} onMove={move} onRemove={remove} onAlt={setAlt} primaryLabel={multiple ? primaryLabel : null} />
          ))}
        </ul>
      )}

      {!full && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!uploadsDown) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!uploadsDown && !busy) handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            'flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition-colors',
            dragging ? 'border-brand-500 bg-brand-50/50' : error ? 'border-danger-500' : 'border-ink-300 bg-surface/50',
            uploadsDown && 'opacity-60',
          )}
        >
          {busy ? (
            <div className="w-full max-w-xs" role="status" aria-live="polite">
              <p className="mb-2 text-sm font-medium text-ink-700">Uploading… {progress}%</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-ink-200">
                <div className="h-full rounded-full bg-brand-500 transition-[width]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-500 ring-1 ring-line" aria-hidden="true">
                {uploadsDown ? <ImagePlus size={18} /> : <UploadCloud size={18} />}
              </span>
              <p className="text-sm text-ink-700">
                <button type="button" disabled={uploadsDown} onClick={() => inputRef.current?.click()} className="font-semibold text-brand-600 hover:underline disabled:text-ink-400 disabled:no-underline">
                  Click to upload
                </button>{' '}
                or drag and drop
              </p>
              <p className="mt-1 text-xs text-ink-500">
                {hint ?? `JPEG, PNG, WebP or AVIF · up to 5 MB${multiple ? ` · ${remaining} more allowed` : ''}`}
              </p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT.join(',')}
            multiple={multiple}
            className="sr-only"
            tabIndex={-1}
            aria-label={`Upload ${label.toLowerCase()}`}
            onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
          />
        </div>
      )}

      {uploadsDown && (
        <p className="rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-600" role="alert">
          Image uploads are unavailable because cloud storage (Cloudinary) is not configured on the server. Paste a public image URL instead.
        </p>
      )}
      {showUrl && !full && <UrlForm disabled={busy} onAdd={(url) => add([{ url, alt: '' }])} />}
      {error && (
        <p className="text-xs font-medium text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
