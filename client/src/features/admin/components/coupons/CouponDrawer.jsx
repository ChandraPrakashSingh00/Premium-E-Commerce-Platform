import { Pencil, Receipt } from 'lucide-react';
import { Button, Drawer, EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/ui';
import { formatDateTime, formatNumber, formatPrice, formatRelative } from '@/utils/format';
import { useAdminCoupon } from '../../hooks/useCoupons';
import { couponState } from '../../utils';
import { DetailRow } from '../FormSection';
import { StatusBadge } from '../StatusBadge';
import { formatDiscount } from './couponSchema';

function CouponSummary({ coupon }) {
  return (
    <div className="px-5 py-5">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="font-mono text-lg font-semibold tracking-wide text-ink-900">{coupon.code}</p>
        <StatusBadge type="coupon" value={couponState(coupon)} />
      </div>
      {coupon.description && <p className="mb-3 text-sm text-ink-600">{coupon.description}</p>}
      <dl className="divide-y divide-line rounded-xl border border-line px-4">
        <DetailRow label="Discount">{formatDiscount(coupon)}</DetailRow>
        <DetailRow label="Minimum order">{coupon.minOrderAmount > 0 ? formatPrice(coupon.minOrderAmount) : 'None'}</DetailRow>
        <DetailRow label="Used">
          {formatNumber(coupon.usedCount)} / {coupon.usageLimit > 0 ? formatNumber(coupon.usageLimit) : 'Unlimited'}
        </DetailRow>
        <DetailRow label="Per customer">{coupon.perUserLimit}</DetailRow>
        <DetailRow label="Starts">{formatDateTime(coupon.startsAt)}</DetailRow>
        <DetailRow label="Expires">{formatDateTime(coupon.expiresAt)}</DetailRow>
        <DetailRow label="Created">{formatDateTime(coupon.createdAt)}</DetailRow>
      </dl>
    </div>
  );
}

function UsageList({ usages = [] }) {
  return (
    <section className="border-t border-line px-5 py-5">
      <h3 className="mb-3 text-sm font-semibold text-ink-900">Redemptions</h3>
      {usages.length === 0 ? (
        <EmptyState compact icon={<Receipt size={24} strokeWidth={1.5} />} title="Not used yet" description="Orders that use this coupon will be listed here." className="py-6" />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {usages.map((u, i) => (
            <li key={u._id ?? i} className="flex items-start justify-between gap-3 px-3.5 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-900">{u.user?.name ?? 'Deleted user'}</p>
                <p className="truncate text-xs text-ink-500">{u.user?.email}</p>
                {u.order?.orderNumber && <p className="mt-0.5 font-mono text-xs text-ink-600">{u.order.orderNumber}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-ink-900 tabular-nums">−{formatPrice(u.discountAmount)}</p>
                <p className="text-xs text-ink-500" title={formatDateTime(u.createdAt)}>
                  {formatRelative(u.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CouponDrawer({ couponId, onClose, onEdit }) {
  const query = useAdminCoupon(couponId);
  const coupon = query.data?.coupon;
  return (
    <Drawer
      open={Boolean(couponId)}
      onClose={onClose}
      title="Coupon"
      footer={
        coupon && (
          <div className="flex justify-end">
            <Button variant="secondary" leftIcon={<Pencil size={15} />} onClick={() => onEdit(coupon)}>
              Edit coupon
            </Button>
          </div>
        )
      }
    >
      {query.isPending && (
        <div className="space-y-4 px-5 py-5" aria-busy="true">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-48 rounded-xl" />
          <SkeletonText lines={3} />
        </div>
      )}
      {query.isError && <ErrorState error={query.error} onRetry={query.refetch} compact />}
      {coupon && (
        <>
          <CouponSummary coupon={coupon} />
          <UsageList usages={query.data.usages} />
        </>
      )}
    </Drawer>
  );
}
