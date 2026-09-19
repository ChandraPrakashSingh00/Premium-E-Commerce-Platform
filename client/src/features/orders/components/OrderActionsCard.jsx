import { useState } from 'react';
import { LifeBuoy, RotateCcw, XCircle } from 'lucide-react';
import { Badge, Button, Card, CardHeader } from '@/components/ui';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { formatDate, formatPrice, titleCase } from '@/utils/format';
import { CancelOrderModal, ReturnOrderModal } from './OrderReasonModal';

const RETURN_TONE = { requested: 'warning', approved: 'brand', rejected: 'danger', completed: 'success' };
const REFUND_TONE = { pending: 'warning', processed: 'success', failed: 'danger' };

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-ink-600">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

/** Cancel / return actions (server-driven flags) + return & refund status. Payment retry lives in the page banner. */
export function OrderActionsCard({ order }) {
  const [dialog, setDialog] = useState(null); // 'cancel' | 'return'
  const { settings } = useStoreSettings();
  const { returnRequest, refund } = order;
  const hasActions = order.canCancel || order.canReturn;

  return (
    <Card>
      <CardHeader title={hasActions ? 'Manage Order' : 'Need Anything?'} />

      {(returnRequest?.status || (refund && refund.status !== 'none')) && (
        <div className="mb-5 space-y-2.5 rounded-xl border border-line bg-surface p-4">
          {returnRequest?.status && (
            <>
              <InfoRow label="Return">
                <Badge tone={RETURN_TONE[returnRequest.status] ?? 'neutral'}>{titleCase(returnRequest.status)}</Badge>
              </InfoRow>
              {returnRequest.reason && <p className="text-xs text-ink-500">Reason: {returnRequest.reason}</p>}
              {returnRequest.adminNote && <p className="text-xs text-ink-600">Note from us: {returnRequest.adminNote}</p>}
            </>
          )}
          {refund && refund.status !== 'none' && (
            <>
              <InfoRow label="Refund">
                <Badge tone={REFUND_TONE[refund.status] ?? 'neutral'}>{titleCase(refund.status)}</Badge>
              </InfoRow>
              {refund.amount > 0 && (
                <InfoRow label="Amount">
                  <span className="font-semibold text-ink-900">{formatPrice(refund.amount)}</span>
                </InfoRow>
              )}
              <p className="text-xs text-ink-500">
                {refund.status === 'processed'
                  ? `Refunded ${refund.processedAt ? `on ${formatDate(refund.processedAt)}` : ''} to your original payment method.`
                  : refund.status === 'pending'
                    ? 'Refunds usually reflect in 5–7 business days.'
                    : 'We hit a snag processing your refund. Our team has been notified.'}
              </p>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {order.canReturn && (
          <Button fullWidth variant="outline" leftIcon={<RotateCcw size={16} />} onClick={() => setDialog('return')}>
            Request a Return
          </Button>
        )}
        {order.canCancel && (
          <Button fullWidth variant="secondary" className="text-danger-600! hover:border-danger-500/40!" leftIcon={<XCircle size={16} />} onClick={() => setDialog('cancel')}>
            Cancel Order
          </Button>
        )}
        <Button fullWidth variant="ghost" leftIcon={<LifeBuoy size={16} />} to={`/contact?order=${encodeURIComponent(order.orderNumber)}`}>
          Need help with this order?
        </Button>
      </div>

      <CancelOrderModal open={dialog === 'cancel'} onClose={() => setDialog(null)} order={order} />
      <ReturnOrderModal
        open={dialog === 'return'}
        onClose={() => setDialog(null)}
        order={order}
        returnWindowDays={settings.returnWindowDays}
      />
    </Card>
  );
}
