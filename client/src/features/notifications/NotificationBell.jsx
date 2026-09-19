import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { useLocation } from 'react-router';
import { Drawer, IconButton } from '@/components/ui';
import { useEscapeKey, useIsDesktop, useOnClickOutside } from '@/hooks';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { NotificationList } from './components/NotificationList';
import { useMarkAllNotificationsRead, useNotifications } from './hooks';

function MarkAllButton({ disabled }) {
  const markAll = useMarkAllNotificationsRead();
  return (
    <button
      type="button"
      onClick={() => markAll.mutate()}
      disabled={disabled || markAll.isPending}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 disabled:text-ink-300 disabled:hover:bg-transparent"
    >
      <CheckCheck size={14} aria-hidden="true" />
      Mark all read
    </button>
  );
}

function BellPanel({ query, close, id }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <motion.div
      ref={ref}
      id={id}
      role="dialog"
      aria-label="Notifications"
      tabIndex={-1}
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 z-50 mt-2 flex max-h-[min(560px,75vh)] w-95 origin-top-right flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-lift focus:outline-none"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-ink-900">
          Notifications
          {query.unreadCount > 0 && <span className="ml-1.5 text-ink-400">({query.unreadCount})</span>}
        </p>
        <MarkAllButton disabled={query.unreadCount === 0} />
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <NotificationList query={query} onNavigate={close} />
      </div>
    </motion.div>
  );
}

/**
 * Header bell with unread badge. Desktop: popover; mobile: bottom drawer.
 * Renders nothing for guests.
 */
export default function NotificationBell() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  if (!isAuthenticated) return null;
  return <BellWidget />;
}

function BellWidget() {
  const [open, setOpen] = useState(false);
  const isDesktop = useIsDesktop();
  const query = useNotifications();
  const rootRef = useRef(null);
  const panelId = useId();
  const { pathname } = useLocation();
  const close = useCallback(() => setOpen(false), []);

  useOnClickOutside(rootRef, close, open && isDesktop);
  useEscapeKey(close, open && isDesktop);
  useEffect(() => {
    close();
  }, [pathname, close]);

  const count = query.unreadCount;
  const badge = count > 99 ? '99+' : String(count);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        label={count > 0 ? `Notifications, ${count} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) query.refetch();
        }}
        className="relative"
      >
        <Bell size={20} strokeWidth={1.75} />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-1 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] leading-none font-bold text-white ring-2 ring-white"
          >
            {badge}
          </span>
        )}
      </IconButton>

      {isDesktop ? (
        <AnimatePresence>{open && <BellPanel query={query} close={close} id={panelId} />}</AnimatePresence>
      ) : (
        <Drawer
          open={open}
          onClose={close}
          side="bottom"
          title="Notifications"
          headerExtra={<MarkAllButton disabled={count === 0} />}
        >
          <div className="safe-bottom">
            <NotificationList query={query} onNavigate={close} />
          </div>
        </Drawer>
      )}
    </div>
  );
}
