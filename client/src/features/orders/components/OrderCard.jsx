import { CalendarDays, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton, SmartImage } from '@/components/ui';
import { formatDate, formatPrice, pluralize } from '@/utils/format';
import { OrderStatusBadge, PaymentStatusBadge } from './StatusBadges';

/** Summary card used in order lists (`GET /orders` item shape). */
export function OrderCard({ order }) {
  const thumbs = order.items ?? [];
  const extra = Math.max(0, (order.itemCount ?? thumbs.length) - thumbs.length);
  const showPayment = order.paymentStatus !== 'paid' || order.paymentMethod === 'cod';

  return (
    <Link
      to={`/account/orders/${order._id}`}
      className="group block rounded-2xl border border-line bg-white p-4 transition-[border-color,box-shadow] duration-200 hover:border-brand-300 hover:shadow-soft sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="text-xs text-ink-500">Order ID</p>
          <p className="font-display text-sm font-bold tracking-tight break-all text-ink-900 sm:text-base">{order.orderNumber}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
            <CalendarDays size={12} aria-hidden="true" />
            {formatDate(order.createdAt)} · {pluralize(order.itemCount ?? thumbs.length, 'item')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          {showPayment && ['pending', 'failed'].includes(order.paymentStatus) && order.status !== 'cancelled' && (
            <PaymentStatusBadge status={order.paymentStatus} method={order.paymentMethod} />
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-4">
        <div className="flex min-w-0 items-center gap-2">
          {thumbs.slice(0, 3).map((item, i) => (
            <SmartImage
              key={`${item.name}-${i}`}
              src={item.image}
              alt={item.name}
              width={120}
              className="h-12 w-12 shrink-0 rounded-lg border border-line sm:h-14 sm:w-14"
            />
          ))}
          {extra > 0 && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-bold text-brand-600 sm:h-14 sm:w-14">
              +{extra}
            </span>
          )}
          {thumbs.length === 1 && <p className="ml-2 line-clamp-2 min-w-0 text-sm text-ink-700">{thumbs[0].name}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="text-right">
            <p className="text-xs text-ink-500">Total</p>
            <p className="font-display text-sm font-bold text-ink-900 tabular-nums sm:text-base">{formatPrice(order.pricing?.total)}</p>
          </div>
          <ChevronRight size={18} className="text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-500" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-4 sm:p-5" aria-hidden="true">
      <div className="flex justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-14 w-12" />
          <Skeleton className="h-14 w-12" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
