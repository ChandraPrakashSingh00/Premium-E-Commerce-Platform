import { Link } from 'react-router';
import { Badge } from '@/components/ui';
import { cn } from '@/utils/cn';
import { TXN_META, signedQuantity } from './inventoryUtils';

export function TxnTypeBadge({ type }) {
  const meta = TXN_META[type] ?? { label: type, tone: 'neutral' };
  return (
    <span title={meta.hint} className="inline-flex">
      <Badge tone={meta.tone} dot>
        {meta.label}
      </Badge>
    </span>
  );
}

export function SignedQty({ value, className }) {
  const q = signedQuantity(value);
  return (
    <span className={cn('font-semibold tabular-nums', q.tone, className)}>
      <span aria-hidden="true">{q.text}</span>
      <span className="sr-only">{q.label}</span>
    </span>
  );
}

export function OrderLink({ order }) {
  if (!order?._id) return null;
  return (
    <Link to={`/admin/orders/${order._id}`} className="font-medium text-brand-600 tabular-nums hover:underline">
      {order.orderNumber ? `#${order.orderNumber.replace(/^#/, '')}` : 'View order'}
    </Link>
  );
}
