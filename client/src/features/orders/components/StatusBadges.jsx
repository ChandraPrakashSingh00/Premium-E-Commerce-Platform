import { Badge } from '@/components/ui';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONE } from '@/constants';
import { titleCase } from '@/utils/format';

export function OrderStatusBadge({ status, className }) {
  return (
    <Badge tone={ORDER_STATUS_TONE[status] ?? 'neutral'} dot className={className}>
      {ORDER_STATUS_LABELS[status] ?? titleCase(status)}
    </Badge>
  );
}

export function PaymentStatusBadge({ status, method, className }) {
  const label = PAYMENT_STATUS_LABELS[status] ?? titleCase(status);
  const text = method === 'cod' && status === 'pending' ? 'Pay on delivery' : `Payment ${label.toLowerCase()}`;
  return (
    <Badge tone={method === 'cod' && status === 'pending' ? 'neutral' : (PAYMENT_STATUS_TONE[status] ?? 'neutral')} className={className}>
      {text}
    </Badge>
  );
}
