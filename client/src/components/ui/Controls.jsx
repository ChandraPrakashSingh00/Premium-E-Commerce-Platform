import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { imageUrl, PLACEHOLDER_IMAGE, srcSet } from '@/utils/image';
import { Button } from './Button';
import { Modal } from './Modal';

export function QuantityStepper({ value, onChange, min = 1, max = 10, disabled, size = 'md', className, label = 'Quantity' }) {
  const h = size === 'sm' ? 'h-9' : 'h-11';
  return (
    <div className={cn('inline-flex items-center rounded-lg border border-line bg-white', h, className)} role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className="flex h-full w-10 items-center justify-center text-ink-600 hover:text-ink-900 disabled:opacity-30"
        aria-label="Decrease quantity"
      >
        <Minus size={16} />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className="flex h-full w-10 items-center justify-center text-ink-600 hover:text-ink-900 disabled:opacity-30"
        aria-label="Increase quantity"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

/**
 * Lazy, responsive image with graceful fallback and fade-in.
 * `width` is the rendered width hint used to pick CDN sizes.
 */
export function SmartImage({ src, alt = '', width = 800, sizes, className, imgClassName, priority = false, aspect, ...props }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const finalSrc = failed || !src ? PLACEHOLDER_IMAGE : imageUrl(src, width);
  return (
    <div className={cn('relative overflow-hidden bg-surface', className)} style={aspect ? { aspectRatio: aspect } : undefined}>
      <img
        src={finalSrc}
        srcSet={failed ? undefined : srcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn('h-full w-full object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', imgClassName)}
        {...props}
      />
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cn('scrollbar-none flex gap-1 overflow-x-auto border-b border-line', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          id={`tab-${t.value}`}
          aria-selected={value === t.value}
          aria-controls={`panel-${t.value}`}
          onClick={() => onChange(t.value)}
          className={cn(
            '-mb-px border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors',
            value === t.value ? 'border-brand-500 text-brand-600' : 'border-transparent text-ink-500 hover:text-ink-900',
          )}
        >
          {t.label}
          {t.count !== undefined && <span className={cn('ml-1.5', value === t.value ? 'text-brand-400' : 'text-ink-400')}>({t.count})</span>}
        </button>
      ))}
    </div>
  );
}

export function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
  children,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? <p className="text-sm text-ink-600">This action cannot be undone.</p>}
    </Modal>
  );
}
