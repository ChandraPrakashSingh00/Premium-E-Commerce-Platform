import { PAYMENT_METHOD_LABELS } from '@/constants';
import { formatDateTime, formatPrice } from '@/utils/format';
import { DetailRow } from '../FormSection';
import { AttemptsList, MonoId, RefundsList } from '../payments/PaymentLists';
import { StatusBadge } from '../StatusBadge';
import { SectionCard } from './SectionCard';

/** Payment method, gateway record, attempts and refunds for an order. */
export function PaymentCard({ order }) {
  const payment = order.payment && typeof order.payment === 'object' ? order.payment : null;
  const refund = order.refund ?? {};
  const hasRefund = refund.status && refund.status !== 'none';

  return (
    <SectionCard title="Payment" action={<StatusBadge type="payment" value={order.paymentStatus} />}>
      <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 [&>*]:min-w-0">
        <dl className="divide-y divide-line">
          <DetailRow label="Method">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</DetailRow>
          <DetailRow label="Amount">{formatPrice(payment?.amount ?? order.pricing?.total)}</DetailRow>
          <DetailRow label="Paid at">{order.paidAt ? formatDateTime(order.paidAt) : '—'}</DetailRow>
          {payment && (
            <DetailRow label="Record status">
              <StatusBadge type="paymentRecord" value={payment.status} />
            </DetailRow>
          )}
        </dl>
        {payment ? (
          <dl className="divide-y divide-line">
            <DetailRow label="Razorpay order">
              <MonoId value={payment.razorpayOrderId} />
            </DetailRow>
            <DetailRow label="Razorpay payment">
              <MonoId value={payment.razorpayPaymentId} />
            </DetailRow>
            <DetailRow label="Captured">{payment.capturedAt ? formatDateTime(payment.capturedAt) : '—'}</DetailRow>
            {payment.failureReason && <DetailRow label="Failure">{payment.failureReason}</DetailRow>}
          </dl>
        ) : (
          <p className="py-2 text-sm text-ink-500">No payment record yet.</p>
        )}
      </div>

      {hasRefund && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <StatusBadge type="refund" value={refund.status} />
            <span className="font-semibold text-ink-900 tabular-nums">{formatPrice(refund.amount)}</span>
            {refund.reason && <span className="text-ink-500">· {refund.reason}</span>}
          </div>
          <span className="text-xs text-ink-500">
            {refund.processedAt ? `Processed ${formatDateTime(refund.processedAt)}` : refund.initiatedAt ? `Initiated ${formatDateTime(refund.initiatedAt)}` : ''}
          </span>
        </div>
      )}

      {payment && (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2 [&>*]:min-w-0">
          <AttemptsList attempts={payment.attempts} />
          <RefundsList refunds={payment.refunds} />
        </div>
      )}
    </SectionCard>
  );
}
