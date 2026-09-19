import { useState } from 'react';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, Card, CardHeader, ErrorState, Skeleton, SkeletonText } from '@/components/ui';
import { PAYMENT_METHOD_LABELS } from '@/constants';
import { AddressLines } from '@/features/account/components/AddressCard';
import { refreshMyReviews } from '@/features/account/hooks';
import {
  OrderActionsCard,
  OrderItemsList,
  OrderPriceSummary,
  OrderStatusBadge,
  OrderTracking,
  PaymentStatusBadge,
  ReservationCountdown,
} from '@/features/orders/components';
import { useOrder, useRetryPayment } from '@/features/orders/hooks';
import ReviewFormModal from '@/features/reviews/ReviewFormModal';
import { queryClient, queryKeys } from '@/services/queryClient';
import { formatDateTime, formatPrice } from '@/utils/format';

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading order">
      <Skeleton className="mb-3 h-8 w-64" />
      <Skeleton className="mb-8 h-4 w-40" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <div className="space-y-6">
          <div className="card p-6"><SkeletonText lines={6} /></div>
          <div className="card p-6"><SkeletonText lines={4} /></div>
        </div>
        <div className="card p-6"><SkeletonText lines={5} /></div>
      </div>
    </div>
  );
}

function PaymentPendingBanner({ order }) {
  const retry = useRetryPayment();
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.order(order._id) });
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <p className="font-semibold text-ink-900">Complete your payment</p>
        <p className="mt-1 text-sm text-ink-600">Your order will be confirmed as soon as the payment goes through.</p>
        <ReservationCountdown expiresAt={order.reservationExpiresAt} onExpire={refresh} className="mt-2" />
      </div>
      <Button leftIcon={<CreditCard size={16} />} loading={retry.isPending} onClick={() => retry.mutate(order._id)}>
        Pay {formatPrice(order.pricing?.total)}
      </Button>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const { data: order, isLoading, isError, error, refetch } = useOrder(id);
  const [reviewItem, setReviewItem] = useState(null);

  if (isLoading) return <DetailSkeleton />;
  if (isError || !order) {
    return (
      <ErrorState
        error={error}
        title={error?.status === 404 ? 'Order not found' : undefined}
        description={error?.status === 404 ? 'This order does not exist or belongs to another account.' : undefined}
        onRetry={refetch}
      />
    );
  }

  const delivered = order.status === 'delivered';

  return (
    <>
      <Seo title={`Order ${order.orderNumber}`} noindex />
      <Link to="/account/orders" className="mb-3 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600">
        <ArrowLeft size={16} aria-hidden="true" /> Back to My Orders
      </Link>

      <header className="mb-5 flex flex-col gap-3 rounded-2xl border border-line bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="font-display text-xl font-bold break-all text-ink-900 sm:text-2xl">Order #{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-500">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} method={order.paymentMethod} />
        </div>
      </header>

      {order.canRetryPayment && <PaymentPendingBanner order={order} />}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] *:min-w-0">
        <div className="min-w-0 space-y-5">
          <OrderTracking order={order} />
          <Card>
            <CardHeader
              title={`Items (${order.items.length})`}
              description={delivered ? 'Loved it? Your review helps other shoppers.' : undefined}
            />
            <OrderItemsList items={order.items} canReview={delivered} onReview={setReviewItem} className="-my-5" />
          </Card>
          {order.customerNote && (
            <Card>
              <CardHeader title="Your Note" />
              <p className="text-sm leading-relaxed text-ink-600">{order.customerNote}</p>
            </Card>
          )}
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader title="Payment Summary" />
            <OrderPriceSummary pricing={order.pricing} couponCode={order.coupon?.code} />
            <div className="mt-5 space-y-1 border-t border-line pt-4 text-sm">
              <p className="flex justify-between gap-3">
                <span className="text-ink-600">Method</span>
                <span className="font-medium text-ink-900">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
              </p>
              {order.paidAt && (
                <p className="flex justify-between gap-3">
                  <span className="text-ink-600">Paid on</span>
                  <span className="text-ink-900">{formatDateTime(order.paidAt)}</span>
                </p>
              )}
            </div>
          </Card>
          <Card>
            <CardHeader title="Delivery Address" />
            <AddressLines address={order.shippingAddress} />
            {order.contact?.email && <p className="mt-3 text-sm text-ink-500">Updates sent to {order.contact.email}</p>}
          </Card>
          <OrderActionsCard order={order} />
        </aside>
      </div>

      <ReviewFormModal
        open={Boolean(reviewItem)}
        onClose={() => setReviewItem(null)}
        productId={reviewItem?.product?._id ?? reviewItem?.product}
        productName={reviewItem?.name}
        onSaved={() => {
          setReviewItem(null);
          queryClient.invalidateQueries({ queryKey: queryKeys.order(order._id) });
          refreshMyReviews();
        }}
      />
    </>
  );
}
