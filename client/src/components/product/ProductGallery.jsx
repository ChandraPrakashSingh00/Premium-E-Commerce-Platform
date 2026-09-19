import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { SmartImage } from '@/components/ui';
import { cn } from '@/utils/cn';
import { imageUrl, PLACEHOLDER_IMAGE } from '@/utils/image';
import { ProductLightbox } from './ProductLightbox';

const arrowBtn =
  'absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white/95 text-ink-800 opacity-0 shadow-soft transition hover:text-brand-600 focus-visible:opacity-100 group-hover/main:opacity-100';

function ZoomImage({ image, name, onOpen, priority }) {
  const imgRef = useRef(null);
  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (imgRef.current) imgRef.current.style.transformOrigin = `${x}% ${y}%`;
  };
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseMove={onMove}
      className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-2xl border border-line bg-surface"
      aria-label={`Open ${name} image in fullscreen`}
    >
      <img
        ref={imgRef}
        src={imageUrl(image?.url, 1200) || PLACEHOLDER_IMAGE}
        alt={image?.alt || name}
        fetchPriority={priority ? 'high' : undefined}
        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.8]"
      />
      <span className="pointer-events-none absolute right-4 bottom-4 inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white/95 px-3 text-xs font-semibold text-ink-700 shadow-soft transition-opacity group-hover:opacity-0">
        <Expand size={14} aria-hidden="true" /> Hover to zoom
      </span>
    </button>
  );
}

/**
 * Product image gallery.
 * Desktop: vertical thumbnails (active = blue border) + large surface image with hover zoom.
 * Mobile: swipeable slides with dots. Click/tap opens a fullscreen lightbox (keyboard arrows supported).
 * Props: `images` ([{url, alt}]), `name`. Re-mount with a `key` to reset when images change.
 */
export function ProductGallery({ images = [], name }) {
  const list = images.length ? images : [{ url: '', alt: name }];
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const trackRef = useRef(null);
  const count = list.length;

  const onTrackScroll = (e) => {
    const el = e.currentTarget;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };

  const goToSlide = (i) => {
    setActive(i);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className="lg:flex lg:gap-4">
      {/* Desktop thumbnails */}
      {count > 1 && (
        <div className="scrollbar-none hidden max-h-155 w-20 shrink-0 flex-col gap-3 overflow-y-auto p-0.5 lg:flex" role="list" aria-label="Product images">
          {list.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              role="listitem"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                'shrink-0 overflow-hidden rounded-xl border-2 bg-surface transition',
                i === active ? 'border-brand-500' : 'border-line hover:border-brand-300',
              )}
            >
              <SmartImage src={img.url} alt="" width={160} aspect="1 / 1" />
            </button>
          ))}
        </div>
      )}

      {/* Desktop main image */}
      <div className="group/main relative hidden min-w-0 flex-1 lg:block">
        <ZoomImage image={list[active]} name={name} onOpen={() => setLightbox(true)} priority />
        {count > 1 && (
          <>
            <button type="button" className={cn(arrowBtn, 'left-4')} onClick={() => setActive((active - 1 + count) % count)} aria-label="Previous image">
              <ChevronLeft size={20} />
            </button>
            <button type="button" className={cn(arrowBtn, 'right-4')} onClick={() => setActive((active + 1) % count)} aria-label="Next image">
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Mobile swipe track */}
      <div className="relative -mx-4 sm:mx-0 lg:hidden">
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="scrollbar-none relative flex snap-x snap-mandatory overflow-x-auto bg-surface sm:rounded-2xl sm:border sm:border-line"
          aria-roledescription="carousel"
          aria-label={`${name} images`}
        >
          {list.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => {
                setActive(i);
                setLightbox(true);
              }}
              className="w-full shrink-0 snap-center"
              aria-label={`Image ${i + 1} of ${count}, open fullscreen`}
            >
              <SmartImage src={img.url} alt={img.alt || name} width={900} sizes="100vw" aspect="1 / 1" priority={i === 0} />
            </button>
          ))}
        </div>
        {count > 1 && (
          <>
            <span className="pointer-events-none absolute top-3 right-4 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-ink-700 tabular-nums shadow-sm sm:right-3">
              {active + 1}/{count}
            </span>
            <div className="mt-2 flex justify-center gap-1">
              {list.map((img, i) => (
                <button
                  key={`dot-${img.url}-${i}`}
                  type="button"
                  onClick={() => goToSlide(i)}
                  aria-label={`Go to image ${i + 1}`}
                  aria-current={i === active}
                  className="flex h-6 items-center px-1"
                >
                  <span className={cn('block h-2 rounded-full transition-all', i === active ? 'w-5 bg-brand-500' : 'w-2 bg-ink-300')} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <ProductLightbox
        open={lightbox}
        onClose={() => {
          setLightbox(false);
          const el = trackRef.current;
          if (el?.clientWidth) el.scrollTo({ left: active * el.clientWidth });
        }}
        images={list}
        index={active}
        onIndexChange={setActive}
        name={name}
      />
    </div>
  );
}

export default ProductGallery;
