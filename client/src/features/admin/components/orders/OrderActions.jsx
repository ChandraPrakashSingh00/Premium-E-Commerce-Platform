import { useState } from 'react';
import { Banknote, ChevronDown, Printer, RotateCcw, XCircle } from 'lucide-react';
import { Button, ConfirmationModal, Dropdown } from '@/components/ui';
import { formatPrice } from '@/utils/format';
import { useMarkOrderPaid } from '../../hooks/useOrders';
import { CancelOrderModal } from './CancelOrderModal';
import { orderActions } from './orderForms';
import { RefundModal } from './RefundModal';

/** Header actions for the order detail page (print, mark paid, refund, cancel). */
export function OrderActions({ order }) {
  const [dialog, setDialog] = useState(null);
  const markPaid = useMarkOrderPaid(order._id);
  const { canCancel, canMarkPaid, canRefund, refundable } = orderActions(order);
  const close = () => setDialog(null);

  const items = [
    canMarkPaid && { label: 'Mark COD as paid', icon: <Banknote size={16} />, onClick: () => setDialog('paid') },
    canRefund && { label: `Refund (${formatPrice(refundable)} left)`, icon: <RotateCcw size={16} />, onClick: () => setDialog('refund') },
    canCancel && (canMarkPaid || canRefund) && { divider: true },
    canCancel && { label: 'Cancel order', icon: <XCircle size={16} />, danger: true, onClick: () => setDialog('cancel') },
  ].filter(Boolean);

  return (
    <>
      <Button variant="secondary" size="sm" leftIcon={<Printer size={15} />} onClick={() => window.print()} className="print:hidden">
        Print
      </Button>
      {items.length > 0 && (
        <Dropdown
          label="Order actions"
          items={items}
          trigger={
            <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 text-sm font-semibold text-white hover:bg-brand-600">
              Actions
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          }
        />
      )}

      {canCancel && <CancelOrderModal open={dialog === 'cancel'} onClose={close} order={order} />}
      {canRefund && <RefundModal open={dialog === 'refund'} onClose={close} order={order} max={refundable} />}
      <ConfirmationModal
        open={dialog === 'paid'}
        onClose={close}
        onConfirm={() => markPaid.mutate(undefined, { onSuccess: close })}
        loading={markPaid.isPending}
        tone="primary"
        title="Mark as paid?"
        description={`Confirm that ${formatPrice(order.pricing?.total)} was collected for ${order.orderNumber}.`}
        confirmLabel="Mark as paid"
      >
        <p className="text-sm text-ink-600">Use this once the courier has settled the cash on delivery amount.</p>
      </ConfirmationModal>
    </>
  );
}
