import { Bell, BellOff, Check, CreditCard, Gift, Package, RotateCcw, Truck, Trash2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button, ErrorState, Skeleton } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatRelative } from '@/utils/format';
import { useDeleteNotification, useMarkNotificationRead } from '../hooks';

const ICONS = {
  order_placed: Package,
  order_status: Package,
  order_shipped: Truck,
  order_delivered: Check,
  order_cancelled: XCircle,
  payment_success: CreditCard,
  payment_failed: CreditCard,
  refund: RotateCcw,
  return: RotateCcw,
  welcome: Gift,
};

const isInternal = (link) => typeof link === 'string' && link.startsWith('/') && !link.startsWith('//');

function NotificationItem({ notification, onNavigate }) {
  const navigate = useNavigate();
  const markRead = useMarkNotificationRead();
  const remove = useDeleteNotification();
  const Icon = ICONS[notification.type] ?? Bell;
  const unread = !notification.isRead;
  const danger = notification.type === 'payment_failed' || notification.type === 'order_cancelled';

  const open = () => {
    if (unread) markRead.mutate(notification._id);
    if (isInternal(notification.link)) {
      onNavigate?.();
      navigate(notification.link);
    }
  };

  return (
    <li className={cn('group relative flex gap-3 px-4 py-3.5 transition-colors hover:bg-surface', unread && 'bg-brand-50/40')}>
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          danger ? 'bg-danger-50 text-danger-600' : 'bg-surface text-ink-700 group-hover:bg-white',
        )}
      >
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <button type="button" onClick={open} className="min-w-0 flex-1 rounded-md text-left after:absolute after:inset-0 focus-visible:outline-none">
        <span className="flex items-start gap-2">
          <span className={cn('line-clamp-2 text-sm text-ink-900', unread ? 'font-semibold' : 'font-medium')}>{notification.title}</span>
          {unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-ink-500">{notification.message}</span>
        <span className="mt-1 block text-[11px] text-ink-400">{formatRelative(notification.createdAt)}</span>
      </button>
      <div className="relative z-10 flex shrink-0 flex-col gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
        {unread && (
          <button
            type="button"
            onClick={() => markRead.mutate(notification._id)}
            className="rounded-full p-1.5 text-ink-400 hover:bg-white hover:text-ink-900"
            aria-label={`Mark "${notification.title}" as read`}
            title="Mark as read"
          >
            <Check size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => remove.mutate(notification._id)}
          className="rounded-full p-1.5 text-ink-400 hover:bg-white hover:text-danger-600"
          aria-label={`Delete "${notification.title}"`}
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

export function NotificationList({ query, onNavigate }) {
  const { notifications, isLoading, isError, error, refetch } = query;

  if (isLoading) {
    return (
      <div className="space-y-4 p-4" aria-busy="true" aria-label="Loading notifications">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (isError) return <ErrorState compact error={error} onRetry={refetch} className="px-4" />;
  if (!notifications.length) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          <BellOff size={24} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-ink-900">You are all caught up</p>
        <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-ink-500">Order updates, payment confirmations and offers will show up here.</p>
        <Button variant="outline" size="sm" className="mt-5" to="/account/orders" onClick={onNavigate}>
          View my orders
        </Button>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line" aria-label="Notifications">
      {notifications.map((n) => (
        <NotificationItem key={n._id} notification={n} onNavigate={onNavigate} />
      ))}
    </ul>
  );
}
