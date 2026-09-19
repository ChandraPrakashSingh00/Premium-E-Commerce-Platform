import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Button, Select, Textarea } from '@/components/ui';
import { ORDER_STATUS_LABELS } from '@/constants';
import { applyFieldErrors } from '@/services/apiClient';
import { useCancelOrder, useUpdateOrderStatus } from '../../hooks/useOrders';
import { StatusBadge } from '../StatusBadge';
import { emptyTracking, statusOptions, statusUpdateSchema, toTrackingBody } from './orderForms';
import { SectionCard } from './SectionCard';
import { TrackingFields } from './TrackingFields';

/**
 * Moves an order to one of its allowed next statuses.
 * Choosing "Cancelled" uses the cancel endpoint (releases stock, refunds if paid) with the note as the reason.
 */
export function StatusUpdateCard({ orderId, currentStatus, allowedTransitions = [], tracking }) {
  const defaults = { status: '', note: '', tracking: emptyTracking(tracking) };
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(statusUpdateSchema), defaultValues: defaults });
  const updateStatus = useUpdateOrderStatus(orderId);
  const cancelOrder = useCancelOrder(orderId);
  const pending = updateStatus.isPending || cancelOrder.isPending;

  const status = useWatch({ control, name: 'status' });
  const isFinal = allowedTransitions.length === 0;

  const onSubmit = (values) => {
    const onSuccess = () => reset({ status: '', note: '', tracking: values.tracking });
    const note = values.note.trim() || undefined;
    if (values.status === 'cancelled') {
      // The cancel endpoint calls the field `reason`; surface its errors on the note.
      const onError = (err) =>
        applyFieldErrors(err, (field, error) => setError(field === 'reason' ? 'note' : field, error));
      cancelOrder.mutate({ reason: note }, { onSuccess, onError });
      return;
    }
    const callbacks = { onSuccess, onError: (err) => applyFieldErrors(err, setError) };
    updateStatus.mutate(
      { status: values.status, note, tracking: values.status === 'shipped' ? toTrackingBody(values.tracking) : undefined },
      callbacks,
    );
  };

  return (
    <SectionCard title="Update status" action={<StatusBadge type="order" value={currentStatus} />}>
      {isFinal ? (
        <div className="flex items-start gap-3 text-sm text-ink-500">
          <Lock size={16} className="mt-0.5 shrink-0 text-ink-400" aria-hidden="true" />
          <p>This order is in a final state. No further status changes are possible.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" aria-label="Update order status">
          <Select
            label="New status"
            size="sm"
            required
            placeholder="Select status…"
            options={statusOptions(allowedTransitions)}
            error={errors.status?.message}
            {...register('status')}
          />

          {status === 'shipped' && (
            <fieldset className="space-y-3 rounded-xl border border-line bg-surface/50 p-4" data-testid="shipping-fields">
              <legend className="px-1 text-xs font-medium text-ink-500">Shipment details</legend>
              <TrackingFields register={register} errors={errors.tracking} prefix="tracking." required compact />
            </fieldset>
          )}

          <Textarea
            label={status === 'cancelled' ? 'Cancellation reason' : 'Note'}
            required={status === 'cancelled'}
            rows={3}
            placeholder={status === 'cancelled' ? 'Why is this order being cancelled?' : 'Optional – added to the order timeline'}
            hint={status === 'cancelled' ? 'Stock is released and paid orders are refunded automatically.' : undefined}
            error={errors.note?.message}
            {...register('note')}
          />

          <Button
            type="submit"
            size="sm"
            fullWidth
            variant={status === 'cancelled' ? 'danger' : 'primary'}
            loading={pending}
            disabled={!status}
          >
            {status ? `Mark as ${ORDER_STATUS_LABELS[status] ?? status}` : 'Update status'}
          </Button>
        </form>
      )}
    </SectionCard>
  );
}
