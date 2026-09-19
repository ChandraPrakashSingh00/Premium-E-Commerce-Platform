import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '@/hooks';
import { cn } from '@/utils/cn';

const OFFSETS = { right: { x: '100%' }, left: { x: '-100%' }, bottom: { y: '100%' } };
const POSITION = {
  right: 'inset-y-0 right-0 h-full w-full max-w-md',
  left: 'inset-y-0 left-0 h-full w-[88%] max-w-sm',
  bottom: 'inset-x-0 bottom-0 max-h-[90dvh] w-full rounded-t-3xl',
};

function DrawerPanel({ onClose, title, side, children, footer, className, headerExtra }) {
  const ref = useRef(null);
  const titleId = useId();
  useFocusTrap(ref, true);
  useLockBodyScroll(true);
  useEscapeKey(onClose);

  return (
    <div className="fixed inset-0 z-[70]">
      <motion.div
        className="absolute inset-0 bg-ink-950/45 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn('absolute flex flex-col bg-white shadow-lift focus:outline-none', POSITION[side], className)}
        initial={OFFSETS[side]}
        animate={{ x: 0, y: 0 }}
        exit={OFFSETS[side]}
        transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.38 }}
      >
        {side === 'bottom' && <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-ink-200" aria-hidden="true" />}
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {headerExtra}
            <button onClick={onClose} className="-mr-3 flex h-11 w-11 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-900" aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer && <div className="safe-bottom border-t border-line bg-white px-5 py-4">{footer}</div>}
      </motion.aside>
    </div>
  );
}

export function Drawer({ open, onClose, title, side = 'right', children, footer, className, headerExtra }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <DrawerPanel onClose={onClose} title={title} side={side} footer={footer} className={className} headerExtra={headerExtra}>
          {children}
        </DrawerPanel>
      )}
    </AnimatePresence>,
    document.body,
  );
}
