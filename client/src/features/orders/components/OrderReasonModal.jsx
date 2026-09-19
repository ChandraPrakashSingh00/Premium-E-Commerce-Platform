import { useId } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Button, Modal, Select, Textarea } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import {
  CANCEL_REASONS,
  cancelOrderSchema,
  composeReason,
  RETURN_REASONS,
  returnOrderSchema,
} from '@/validators/account';
import { FormAlert } from '@/features/account/components/FormAlert';
import { useCancelOrder, useReturnOrder } from '../hooks';

function ReasonModal({ open, onClose, title, description, reasons, schema, submitLabel, tone, notePlaceholder, onSubmit, isPending, children, dismissLabel = 'Not now' }) {
  const formId = useId();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { reason: '', note: '' } });
  const reason = useWatch({ control, name: 'reason' });

  const close = () => {
    if (isPending) return;
    reset();
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
      reset();
      onClose();
    } catch (error) {
      const mapped = applyFieldErrors(error, (field, e) => setError(field === 'comment' ? 'note' : field, e));
      if (!mapped) setError('root', { message: error.message });
    }
  });

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={isPending}>
            {dismissLabel}
          </Button>
          <Button type="submit" form={formId} variant={tone} loading={isPending}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4" noValidate>
        {children}
        <FormAlert message={errors.root?.message} />
        <Select
          label="Reason"
          required
          placeholder="Select a reason"
          options={reasons.map((r) => ({ value: r, label: r }))}
          error={errors.reason?.message}
          {...register('reason')}
        />
        <Textarea
          label={reason === 'Other' ? 'Tell us more' : 'Additional details (optional)'}
          required={reason === 'Other'}
          rows={3}
          placeholder={notePlaceholder}
          error={errors.note?.message}
          {...register('note')}
        />
      </form>
    </Modal>
  );
}

export function CancelOrderModal({ open, onClose, order }) {
  const cancel = useCancelOrder(order._id);
  const paid = order.paymentStatus === 'paid';
  return (
    <ReasonModal
      open={open}
      onClose={onClose}
      title="Cancel this order?"
      description={`Order ${order.orderNumber}`}
      reasons={CANCEL_REASONS}
      schema={cancelOrderSchema}
      submitLabel="Cancel order"
      dismissLabel="Keep order"
      tone="danger"
      notePlaceholder="Anything we could have done better?"
      isPending={cancel.isPending}
      onSubmit={(values) => cancel.mutateAsync(composeReason(values))}
    >
      <p className="rounded-xl bg-surface p-4 text-sm leading-relaxed text-ink-600">
        {paid
          ? 'Your refund will be initiated automatically to the original payment method and usually reflects in 5–7 business days.'
          : 'Once cancelled, the items are released and this order cannot be restored.'}
      </p>
    </ReasonModal>
  );
}

export function ReturnOrderModal({ open, onClose, order, returnWindowDays }) {
  const request = useReturnOrder(order._id);
  return (
    <ReasonModal
      open={open}
      onClose={onClose}
      title="Request a return"
      description={`Order ${order.orderNumber}`}
      reasons={RETURN_REASONS}
      schema={returnOrderSchema}
      submitLabel="Submit request"
      tone="primary"
      notePlaceholder="Describe the issue so we can help faster"
      isPending={request.isPending}
      onSubmit={({ reason, note }) =>
        request.mutateAsync({
          reason: reason === 'Other' ? note.trim().slice(0, 500) : reason,
          ...(note?.trim() && reason !== 'Other' && { comment: note.trim() }),
        })
      }
    >
      <p className="rounded-xl bg-surface p-4 text-sm leading-relaxed text-ink-600">
        {returnWindowDays ? `Returns are accepted within ${returnWindowDays} days of delivery. ` : ''}
        Once approved, we will arrange a pickup and refund you after the items pass inspection.
      </p>
    </ReasonModal>
  );
}
