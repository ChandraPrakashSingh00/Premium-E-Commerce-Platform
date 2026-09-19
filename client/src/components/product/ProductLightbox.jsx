import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '@/hooks';
import { imageUrl } from '@/utils/image';

function LightboxPanel({ images, index, onIndexChange, onClose, name }) {
  const ref = useRef(null);
  useFocusTrap(ref, true);
  useLockBodyScroll(true);
  useEscapeKey(onClose);
  const count = images.length;
  const go = (dir) => onIndexChange((index + dir + count) % count);
  const current = images[index];

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  };

  const navBtn =
    'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-brand-500';

  return (
    <motion.div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} – image ${index + 1} of ${count}`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="fixed inset-0 z-[90] flex flex-col bg-ink-950/95 focus:outline-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
        <p className="text-sm text-white/70 tabular-nums">
          {index + 1} / {count}
        </p>
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10" aria-label="Close gallery" data-autofocus>
          <X size={22} />
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-20">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={current?.url}
            src={imageUrl(current?.url, 1600)}
            alt={current?.alt || name}
            className="max-h-full max-w-full rounded-lg object-contain select-none"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            drag={count > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.4}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
          />
        </AnimatePresence>
        {count > 1 && (
          <>
            <button type="button" className={`${navBtn} left-3 hidden sm:flex`} onClick={() => go(-1)} aria-label="Previous image">
              <ChevronLeft size={24} />
            </button>
            <button type="button" className={`${navBtn} right-3 hidden sm:flex`} onClick={() => go(1)} aria-label="Next image">
              <ChevronRight size={24} />
            </button>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="scrollbar-none safe-bottom flex justify-center gap-2 overflow-x-auto px-4 pb-4">
          {images.map((img, i) => (
            <button
              key={`${img.url}-${i}`}
              type="button"
              onClick={() => onIndexChange(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={`h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === index ? 'border-brand-500' : 'border-transparent opacity-50 hover:opacity-100'}`}
            >
              <img src={imageUrl(img.url, 160)} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** Fullscreen image viewer. Props: `open`, `onClose`, `images`, `index`, `onIndexChange`, `name`. */
export function ProductLightbox({ open, ...props }) {
  return createPortal(<AnimatePresence>{open && <LightboxPanel {...props} />}</AnimatePresence>, document.body);
}

export default ProductLightbox;
