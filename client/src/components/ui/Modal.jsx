import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '@/hooks';
import { cn } from '@/utils/cn';

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

function ModalPanel({ onClose, title, description, size, children, footer, className, dismissible }) {
  const ref = useRef(null);
  const titleId = useId();
  const descId = useId();
  useFocusTrap(ref, true);
  useLockBodyScroll(true);
  useEscapeKey(() => dismissible && onClose());

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <motion.div
        className="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => dismissible && onClose()}
        aria-hidden="true"
      />
      <motion.div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift focus:outline-none sm:rounded-3xl',
          SIZES[size],
          className,
        )}
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: 'spring', damping: 30, stiffness: 380 }}
      >
        {(title || dismissible) && (
          <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
            <div>
              {title && (
                <h2 id={titleId} className="text-lg font-semibold">
                  {title}
                </h2>
              )}
              {description && (
                <p id={descId} className="mt-1 text-sm text-ink-500">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button onClick={onClose} className="-m-2 rounded-full p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900" aria-label="Close dialog">
                <X size={20} />
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-3 border-t border-line bg-ink-50/60 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </motion.div>
    </div>
  );
}

export function Modal({ open, onClose, title, description, size = 'md', children, footer, className, dismissible = true }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalPanel onClose={onClose} title={title} description={description} size={size} footer={footer} className={className} dismissible={dismissible}>
          {children}
        </ModalPanel>
      )}
    </AnimatePresence>,
    document.body,
  );
}
