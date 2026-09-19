import { useState } from 'react';
import { Button } from '@/components/ui';
import { formatDateTime } from '@/utils/format';
import { useOrderReturn } from '../../hooks/useOrders';
import { DetailRow } from '../FormSection';
import { StatusBadge } from '../StatusBadge';
import { NoteActionModal } from './NoteActionModal';
import { SectionCard } from './SectionCard';

const ACTIONS = {
  approve: {
    title: 'Approve return',
    description: 'Approve the request so the customer can send the items back.',
    confirmLabel: 'Approve return',
    tone: 'primary',
  },
  reject: {
    title: 'Reject return',
    description: 'Decline the request. The order stays delivered.',
    confirmLabel: 'Reject return',
    tone: 'danger',
  },
  complete: {
    title: 'Complete return',
    description: 'Items are restocked and the payment is refunded. This cannot be undone.',
    confirmLabel: 'Complete & refund',
    tone: 'primary',
  },
};

/** Customer return request with approve / reject / complete actions. */
export function ReturnRequestCard({ orderId, returnRequest }) {
  const [action, setAction] = useState(null);
  const mutation = useOrderReturn(orderId);
  if (!returnRequest?.status) return null;

  const { status } = returnRequest;
  const config = action ? ACTIONS[action] : ACTIONS.approve;

  const submit = (note) => mutation.mutate({ action, note }, { onSuccess: () => setAction(null) });

  return (
    <SectionCard
      title="Return request"
      action={<StatusBadge type="return" value={status} />}
    >
      <dl className="divide-y divide-line">
        <DetailRow label="Reason">{returnRequest.reason}</DetailRow>
        {returnRequest.comment && <DetailRow label="Comment">{returnRequest.comment}</DetailRow>}
        <DetailRow label="Requested">{formatDateTime(returnRequest.requestedAt)}</DetailRow>
        {returnRequest.resolvedAt && <DetailRow label="Resolved">{formatDateTime(returnRequest.resolvedAt)}</DetailRow>}
        {returnRequest.adminNote && <DetailRow label="Admin note">{returnRequest.adminNote}</DetailRow>}
      </dl>

      {status === 'requested' && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setAction('approve')}>
            Approve
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAction('reject')}>
            Reject
          </Button>
        </div>
      )}
      {status === 'approved' && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={() => setAction('complete')}>
            Mark completed
          </Button>
          <p className="text-xs text-ink-500">Restocks the items and refunds the customer.</p>
        </div>
      )}

      <NoteActionModal
        open={Boolean(action)}
        onClose={() => setAction(null)}
        title={config.title}
        description={config.description}
        confirmLabel={config.confirmLabel}
        tone={config.tone}
        loading={mutation.isPending}
        onSubmit={submit}
        noteLabel="Note"
      />
    </SectionCard>
  );
}
