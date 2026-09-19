import { useParams } from 'react-router';
import { ErrorState } from '@/components/ui';
import { PageHeader, StatusBadge } from '@/features/admin/components';
import { AdminNoteCard } from '@/features/admin/components/orders/AdminNoteCard';
import { OrderActions } from '@/features/admin/components/orders/OrderActions';
import { OrderDetailSkeleton } from '@/features/admin/components/orders/OrderDetailSkeleton';
import { OrderItemsCard } from '@/features/admin/components/orders/OrderItemsCard';
import {
  CancellationCard,
  CustomerCard,
  CustomerNoteCard,
  ShippingAddressCard,
} from '@/features/admin/components/orders/OrderSidebarCards';
import { OrderTimeline } from '@/features/admin/components/orders/OrderTimeline';
import { PaymentCard } from '@/features/admin/components/orders/PaymentCard';
import { ReturnRequestCard } from '@/features/admin/components/orders/ReturnRequestCard';
import { StatusUpdateCard } from '@/features/admin/components/orders/StatusUpdateCard';
import { TrackingCard } from '@/features/admin/components/orders/TrackingCard';
import { useAdminOrder } from '@/features/admin/hooks/useOrders';
import { formatDateTime } from '@/utils/format';

const BACK = { to: '/admin/orders', label: 'Orders' };

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isPending, error, refetch } = useAdminOrder(id);

  if (isPending) return <OrderDetailSkeleton />;
  if (error || !order) {
    return (
      <>
        <PageHeader title="Order" back={BACK} />
        <div className="rounded-xl border border-line bg-white">
          <ErrorState
            error={error}
            title={error?.status === 404 ? 'Order not found' : undefined}
            description={error?.status === 404 ? 'This order does not exist or was removed.' : undefined}
            onRetry={() => refetch()}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={order.orderNumber}
        back={BACK}
        eyebrow="Order"
        meta={
          <>
            <StatusBadge type="order" value={order.status} />
            <StatusBadge type="payment" value={order.paymentStatus} />
            <span className="text-sm text-ink-500">
              Placed <time dateTime={order.createdAt}>{formatDateTime(order.createdAt)}</time>
            </span>
          </>
        }
        actions={<OrderActions order={order} />}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <OrderItemsCard order={order} />
          <ReturnRequestCard orderId={order._id} returnRequest={order.returnRequest} />
          <PaymentCard order={order} />
          <OrderTimeline history={order.statusHistory} />
        </div>

        <aside className="min-w-0 space-y-6" aria-label="Order management">
          <div className="print:hidden">
            <StatusUpdateCard
              key={order.status}
              orderId={order._id}
              currentStatus={order.status}
              allowedTransitions={order.allowedTransitions ?? []}
              tracking={order.tracking}
            />
          </div>
          <CancellationCard cancellation={order.status === 'cancelled' ? order.cancellation : null} />
          <TrackingCard orderId={order._id} tracking={order.tracking ?? {}} />
          <CustomerCard user={order.user} contact={order.contact} />
          <ShippingAddressCard address={order.shippingAddress} />
          <CustomerNoteCard note={order.customerNote} />
          <AdminNoteCard key={order._id} orderId={order._id} adminNote={order.adminNote ?? ''} />
        </aside>
      </div>
    </>
  );
}
