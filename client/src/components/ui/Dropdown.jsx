import { useCallback, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router';
import { useEscapeKey, useOnClickOutside } from '@/hooks';
import { cn } from '@/utils/cn';

/**
 * Menu-button dropdown with keyboard support.
 * items: [{ label, icon?, onClick?, to?, danger?, divider? }]
 */
export function Dropdown({ trigger, items, align = 'right', className, label = 'Open menu' }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const close = useCallback(() => setOpen(false), []);
  useOnClickOutside(rootRef, close, open);
  useEscapeKey(close, open);

  const focusItem = (dir) => {
    const nodes = [...(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])];
    const index = nodes.indexOf(document.activeElement);
    const next = nodes[(index + dir + nodes.length) % nodes.length];
    next?.focus();
  };

  const onMenuKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusItem(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusItem(-1);
    } else if (e.key === 'Tab') {
      close();
    }
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={typeof trigger === 'string' ? undefined : label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => focusItem(1));
          }
        }}
        className="inline-flex items-center rounded-full"
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            id={menuId}
            role="menu"
            onKeyDown={onMenuKeyDown}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={cn(
              'absolute z-50 mt-2 min-w-[220px] origin-top rounded-xl border border-line bg-white p-1.5 shadow-lift',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {items.map((item, i) => {
              if (item.divider) return <div key={`d-${i}`} className="my-1.5 h-px bg-line" role="separator" />;
              const cls = cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus:outline-none',
                item.danger ? 'text-danger-600 hover:bg-danger-50 focus:bg-danger-50' : 'text-ink-700 hover:bg-brand-50 hover:text-brand-700 focus:bg-brand-50',
              );
              const content = (
                <>
                  {item.icon && <span className="text-ink-400">{item.icon}</span>}
                  {item.label}
                </>
              );
              return item.to ? (
                <Link key={item.label} to={item.to} role="menuitem" className={cls} onClick={close}>
                  {content}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  role="menuitem"
                  className={cls}
                  onClick={() => {
                    close();
                    item.onClick?.();
                  }}
                >
                  {content}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
