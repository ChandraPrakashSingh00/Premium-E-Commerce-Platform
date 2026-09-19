import { ArrowUpRight } from 'lucide-react';
import { Button, Drawer, ErrorState, Skeleton, SkeletonText } from '@/components/ui';
import { PAYMENT_METHOD_LABELS } from '@/constants';
import { formatDateTime, formatPrice, titleCase } from '@/utils/format';
import { useAdminPayment } from '../../hooks/usePayments';
import { DetailRow } from '../FormSection';
import { StatusBadge } from '../StatusBadge';
import { AttemptsList, MonoId, RefundsList } from './PaymentLists';

function DrawerSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading payment">
      <Skeleton className="h-8 w-40" />
      <SkeletonText lines={8} />
      <SkeletonText lines={3} />
    </div>
  );
}

function PaymentDetail({ payment }) {
  const order = payment.order && typeof payment.order === 'object' ? payment.order : null;
  const user = payment.user && typeof payment.user === 'object' ? payment.user : null;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-ink-500">Amount</p>
          <p className="font-display text-2xl font-semibold text-ink-900 tabular-nums">{formatPrice(payment.amount)}</p>
        </div>
        <StatusBadge type="paymentRecord" value={payment.status} />
      </div>

      <dl className="divide-y divide-line rounded-xl border border-line px-4">
        <DetailRow label="Currency">{payment.currency || 'INR'}</DetailRow>
        <DetailRow label="Refunded">{formatPrice(payment.amountRefunded)}</DetailRow>
        <DetailRow label="Method">{PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}</DetailRow>
        <DetailRow label="Payment mode">{payment.paymentMode ? titleCase(payment.paymentMode) : '—'}</DetailRow>
        <DetailRow label="Razorpay order">
          <MonoId value={payment.razorpayOrderId} />
        </DetailRow>
        <DetailRow label="Razorpay payment">
          <MonoId value={payment.razorpayPaymentId} />
        </DetailRow>
        <DetailRow label="Captured">{payment.capturedAt ? formatDateTime(payment.capturedAt) : '—'}</DetailRow>
        <DetailRow label="Created">{formatDateTime(payment.createdAt)}</DetailRow>
        {user && (
          <DetailRow label="Customer">
            <span className="block">{user.name}</span>
            <span className="block text-xs font-normal text-ink-500">{user.email}</span>
          </DetailRow>
        )}
        {payment.failureReason && (
          <DetailRow label="Failure reason">
            <span className="text-danger-600">{payment.failureReason}</span>
          </DetailRow>
        )}
      </dl>

      <AttemptsList attempts={payment.attempts} />
      <RefundsList refunds={payment.refunds} />

      {order && (
        <Button to={`/admin/orders/${order._id}`} variant="secondary" size="sm" rightIcon={<ArrowUpRight size={15} />}>
          View order {order.orderNumber}
        </Button>
      )}
    </div>
  );
}

/** Side panel with the full payment record (attempts, refunds, order link). */
export function PaymentDetailDrawer({ open, paymentId, onClose }) {
  const query = useAdminPayment(paymentId);
  return (
    <Drawer open={open && Boolean(paymentId)} onClose={onClose} title="Payment details" className="max-w-xl">
      <div className="px-5 py-5 sm:px-6">
        {query.isPending ? (
          <DrawerSkeleton />
        ) : query.error ? (
          <ErrorState error={query.error} onRetry={() => query.refetch()} compact />
        ) : (
          <PaymentDetail payment={query.data} />
        )}
      </div>
    </Drawer>
  );
}
