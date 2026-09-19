import { CreditCard, LifeBuoy, RefreshCw, SearchX, X } from 'lucide-react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { OrderItemsList, OrderPriceSummary, ReservationCountdown } from '@/features/orders/components';
import { useOrder, useRetryPayment } from '@/features/orders/hooks';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { queryClient, queryKeys } from '@/services/queryClient';
import { formatPrice } from '@/utils/format';

const MAX_REASON = 200;

function Shell({ children }) {
  return (
    <div className="bg-surface">
      <Seo title="Payment" noindex />
      <div className="container-page py-8">{children}</div>
    </div>
  );
}

export default function CheckoutFailurePage() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const rawReason = params.get('reason');
  const reason = rawReason ? rawReason.slice(0, MAX_REASON) : null;
  const { settings } = useStoreSettings();
  const retry = useRetryPayment();
  const { data: order, isLoading, isError, error, refetch } = useOrder(orderId, { staleTime: 0 });

  if (!orderId) {
    return (
      <Shell>
        <EmptyState
          className="rounded-2xl border border-line bg-white px-6"
          icon={<SearchX size={28} strokeWidth={1.6} />}
          title="Nothing to show here"
          action={<Button to="/account/orders">View My Orders</Button>}
        />
      </Shell>
    );
  }
  if (isLoading) {
    return (
      <div className="container-page max-w-3xl py-12" aria-busy="true">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-8 w-64" />
        <Skeleton className="mt-10 h-56 rounded-2xl" />
      </div>
    );
  }
  if (isError || !order) {
    return (
      <Shell>
        <ErrorState error={error} onRetry={refetch} className="rounded-2xl border border-line bg-white px-6" />
      </Shell>
    );
  }
  // Paid in the meantime (e.g. webhook arrived) – nothing to retry.
  if (order.paymentStatus === 'paid') return <Navigate to={`/checkout/success?order=${encodeURIComponent(order._id)}`} replace />;

  const canRetry = order.canRetryPayment;
  const expireRefresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.order(order._id) });

  return (
    <div className="bg-surface">
      <Seo title="Payment not completed" noindex />
      <div className="container-page max-w-3xl py-6 sm:py-10">
        <header className="rounded-2xl border border-line bg-white px-5 py-10 text-center sm:py-12" role="alert">
          <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-danger-500 text-white ring-8 ring-danger-50">
            <X size={44} strokeWidth={3} aria-hidden="true" />
          </span>
          <h1 className="mt-7 font-display text-2xl font-bold sm:text-3xl">{canRetry ? 'Payment Not Completed' : 'This order can no longer be paid'}</h1>
          <p className="mt-2 text-sm text-ink-500">
            Order Number: <span className="font-mono font-bold text-ink-900">{order.orderNumber}</span>
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500 sm:text-base">
            {canRetry
              ? 'Your order is saved and the items are held for you. If any amount was debited for this attempt, it will be refunded automatically within 5–7 business days.'
              : 'The reservation for this order has ended and the items were released. You can place a new order any time.'}
          </p>
          {reason && canRetry && (
            <p className="mx-auto mt-4 inline-block max-w-md rounded-lg border border-danger-500/20 bg-danger-50 px-4 py-2.5 text-sm wrap-break-word text-danger-600">
              <span className="font-semibold">Reason:</span> {reason}
            </p>
          )}
          {canRetry && order.reservationExpiresAt && (
            <div className="mt-5 flex justify-center">
              <ReservationCountdown expiresAt={order.reservationExpiresAt} onExpire={expireRefresh} className="rounded-full bg-warning-50 px-4 py-2 text-warning-600" />
            </div>
          )}
          <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            {canRetry ? (
              <Button size="lg" leftIcon={<CreditCard size={18} aria-hidden="true" />} loading={retry.isPending} onClick={() => retry.mutate(order._id)}>
                Retry Payment · {formatPrice(order.pricing?.total)}
              </Button>
            ) : (
              <Button size="lg" to="/cart" leftIcon={<RefreshCw size={18} aria-hidden="true" />}>
                Go to Cart
              </Button>
            )}
            <Button size="lg" variant="outline" to={`/account/orders/${order._id}`}>
              View Order
            </Button>
          </div>
        </header>

        <section className="mt-4 rounded-2xl border border-line bg-white p-5 sm:p-6" aria-labelledby="failure-summary-heading">
          <h2 id="failure-summary-heading" className="mb-1 font-display text-lg font-semibold">
            Order Summary
          </h2>
          <OrderItemsList items={order.items} compact />
          <div className="mt-4 border-t border-line pt-5">
            <OrderPriceSummary pricing={order.pricing} couponCode={order.coupon?.code} />
          </div>
        </section>

        <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-line bg-white p-5 text-center text-sm text-ink-500 sm:flex-row sm:text-left">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <LifeBuoy size={20} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="min-w-0 wrap-break-word">
            Having trouble? Our team can help –{' '}
            {settings.supportEmail ? (
              <a href={`mailto:${settings.supportEmail}?subject=${encodeURIComponent(`Payment issue – ${order.orderNumber}`)}`} className="link">
                {settings.supportEmail}
              </a>
            ) : null}
            {settings.supportEmail && ' or '}
            <Link to="/contact" className="link">
              contact support
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
