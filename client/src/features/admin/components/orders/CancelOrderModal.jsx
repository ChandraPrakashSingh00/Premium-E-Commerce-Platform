import { useId } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Modal, Textarea } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import { useCancelOrder } from '../../hooks/useOrders';
import { cancelSchema } from './orderForms';

function CancelForm({ formId, mutation, onDone, paid }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(cancelSchema), defaultValues: { reason: '' } });
  const onSubmit = (values) => mutation.mutate(values, { onSuccess: onDone, onError: (err) => applyFieldErrors(err, setError) });
  return (
    <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="rounded-xl bg-danger-50 px-4 py-3 text-sm text-danger-600">
        Reserved stock is released{paid ? ' and the customer is refunded automatically' : ''}. This cannot be undone.
      </div>
      <Textarea
        label="Reason"
        required
        rows={3}
        placeholder="e.g. Customer requested cancellation"
        error={errors.reason?.message}
        {...register('reason')}
      />
    </form>
  );
}

export function CancelOrderModal({ open, onClose, order }) {
  const formId = useId();
  const mutation = useCancelOrder(order._id);
  const close = () => !mutation.isPending && onClose();
  const paid = ['paid', 'partially_refunded'].includes(order.paymentStatus);
  return (
    <Modal
      open={open}
      onClose={close}
      title={`Cancel ${order.orderNumber}?`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={mutation.isPending}>
            Keep order
          </Button>
          <Button type="submit" form={formId} variant="danger" loading={mutation.isPending}>
            Cancel order
          </Button>
        </>
      }
    >
      <CancelForm formId={formId} mutation={mutation} onDone={onClose} paid={paid} />
    </Modal>
  );
}
