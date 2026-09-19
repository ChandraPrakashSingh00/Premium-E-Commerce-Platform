import { useId, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Pencil } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button, Modal } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import { formatDate, formatDateTime } from '@/utils/format';
import { useUpdateTracking } from '../../hooks/useOrders';
import { DetailRow } from '../FormSection';
import { emptyTracking, toTrackingBody, trackingFieldsSchema } from './orderForms';
import { SectionCard } from './SectionCard';
import { TrackingFields } from './TrackingFields';

function TrackingForm({ formId, tracking, mutation, onDone }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({ resolver: zodResolver(trackingFieldsSchema), defaultValues: emptyTracking(tracking) });
  const onSubmit = (values) =>
    mutation.mutate(toTrackingBody(values), { onSuccess: onDone, onError: (err) => applyFieldErrors(err, setError) });
  return (
    <form id={formId} noValidate onSubmit={handleSubmit(onSubmit)}>
      <TrackingFields register={register} errors={errors} />
    </form>
  );
}

/** Carrier, tracking number and delivery dates with an edit modal. */
export function TrackingCard({ orderId, tracking = {} }) {
  const [editing, setEditing] = useState(false);
  const formId = useId();
  const mutation = useUpdateTracking(orderId);
  const close = () => !mutation.isPending && setEditing(false);
  const hasTracking = Boolean(tracking?.carrier || tracking?.trackingNumber);

  return (
    <SectionCard
      title="Tracking"
      action={
        <Button size="sm" variant="ghost" aria-label="Edit tracking" leftIcon={<Pencil size={14} />} onClick={() => setEditing(true)}>
          Edit
        </Button>
      }
    >
      {hasTracking || tracking?.shippedAt ? (
        <dl className="-my-2 divide-y divide-line">
          <DetailRow label="Carrier">{tracking.carrier || '—'}</DetailRow>
          <DetailRow label="Tracking no.">
            {tracking.trackingNumber ? <span className="font-mono text-xs">{tracking.trackingNumber}</span> : '—'}
          </DetailRow>
          {tracking.trackingUrl && (
            <DetailRow label="Link">
              <a href={tracking.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">
                Track shipment
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </DetailRow>
          )}
          <DetailRow label="Est. delivery">{tracking.estimatedDelivery ? formatDate(tracking.estimatedDelivery) : '—'}</DetailRow>
          <DetailRow label="Shipped">{tracking.shippedAt ? formatDateTime(tracking.shippedAt) : '—'}</DetailRow>
          <DetailRow label="Delivered">{tracking.deliveredAt ? formatDateTime(tracking.deliveredAt) : '—'}</DetailRow>
        </dl>
      ) : (
        <p className="text-sm text-ink-500">No shipment details yet. They are added when the order is marked as shipped.</p>
      )}

      <Modal
        open={editing}
        onClose={close}
        title="Edit tracking"
        description="Customers see these details on their order page."
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" form={formId} loading={mutation.isPending}>
              Save tracking
            </Button>
          </>
        }
      >
        <TrackingForm formId={formId} tracking={tracking} mutation={mutation} onDone={() => setEditing(false)} />
      </Modal>
    </SectionCard>
  );
}
