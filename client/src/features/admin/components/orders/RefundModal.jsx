import { useId, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button, Input, Modal, Textarea } from '@/components/ui';
import { PAYMENT_METHOD_LABELS } from '@/constants';
import { formatPrice } from '@/utils/format';
import { useRefundOrder } from '../../hooks/useOrders';
import { refundedAmount, refundSchema } from './orderForms';

function RefundForm({ formId, order, max, onReview, values }) {
  const schema = useMemo(() => refundSchema(max), [max]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: values ?? { amount: max, reason: '' } });
  return (
    <form id={formId} noValidate onSubmit={handleSubmit(onReview)} className="space-y-4">
      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
        <div>
          <dt className="text-ink-500">Order total</dt>
          <dd className="font-semibold text-ink-900 tabular-nums">{formatPrice(order.pricing?.total)}</dd>
        </div>
        <div>
          <dt className="text-ink-500">Already refunded</dt>
          <dd className="font-semibold text-ink-900 tabular-nums">{formatPrice(refundedAmount(order))}</dd>
        </div>
      </dl>
      <Input
        label="Refund amount (₹)"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0.01"
        max={max}
        required
        hint={`Up to ${formatPrice(max)}. Leave at the maximum for a full refund.`}
        error={errors.amount?.message}
        {...register('amount')}
      />
      <Textarea label="Reason" rows={3} placeholder="Optional – shown in the refund record" error={errors.reason?.message} {...register('reason')} />
    </form>
  );
}

/** Two-step refund: enter amount → confirm. */
export function RefundModal({ open, onClose, order, max }) {
  const formId = useId();
  const [draft, setDraft] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const review = confirming ? draft : null;
  const mutation = useRefundOrder(order._id);
  const pending = mutation.isPending;

  const close = () => {
    if (pending) return;
    setDraft(null);
    setConfirming(false);
    onClose();
  };

  const confirm = () => {
    const amount = Number(review.amount);
    const body = { amount: amount < max ? amount : undefined, reason: review.reason.trim() || undefined };
    // Errors are toasted by the hook; the admin can go Back to adjust the amount.
    mutation.mutate(body, { onSuccess: close });
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={review ? 'Confirm refund' : `Refund ${order.orderNumber}`}
      size="sm"
      footer={
        review ? (
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={pending}>
              Back
            </Button>
            <Button variant="danger" onClick={confirm} loading={pending}>
              Refund {formatPrice(review.amount)}
            </Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              Review refund
            </Button>
          </>
        )
      }
    >
      {review ? (
        <div className="space-y-4 text-sm">
          <div className="flex gap-3 rounded-xl bg-danger-50 px-4 py-3 text-danger-600">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              You are about to refund <strong className="tabular-nums">{formatPrice(review.amount)}</strong>
              {Number(review.amount) >= max ? ' (full remaining amount)' : ' (partial refund)'}. Refunds cannot be reversed.
            </p>
          </div>
          <dl className="space-y-1.5">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-500">Payment method</dt>
              <dd className="font-medium text-ink-900">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</dd>
            </div>
            {review.reason && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Reason</dt>
                <dd className="text-right font-medium text-ink-900">{review.reason}</dd>
              </div>
            )}
          </dl>
          {order.paymentMethod === 'cod' && <p className="text-xs text-ink-500">COD orders are refunded outside the gateway – settle with the customer directly.</p>}
        </div>
      ) : (
        <RefundForm
          formId={formId}
          order={order}
          max={max}
          values={draft}
          onReview={(values) => {
            setDraft(values);
            setConfirming(true);
          }}
        />
      )}
    </Modal>
  );
}
