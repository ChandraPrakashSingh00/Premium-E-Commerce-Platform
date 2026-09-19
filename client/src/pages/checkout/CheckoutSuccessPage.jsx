import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Clock, Copy, Mail, Package, ShoppingBag } from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, EmptyState, ErrorState, Skeleton, Spinner } from '@/components/ui';
import { PAYMENT_METHOD_LABELS } from '@/constants';
import { AddressLines } from '@/features/account/components/AddressCard';
import { CheckoutStepper } from '@/features/checkout/components/CheckoutStepper';
import { OrderItemsList, OrderPriceSummary, PaymentStatusBadge } from '@/features/orders/components';
import { useOrder } from '@/features/orders/hooks';
import { queryClient, queryKeys } from '@/services/queryClient';
import { toast } from '@/store/toastStore';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/format';

const CONFIRM_TIMEOUT = 30_000;
const POLL_EVERY = 3_000;

const awaitingPayment = (order) => order?.paymentMethod === 'razorpay' && order.paymentStatus === 'pending' && order.status === 'pending';

function SuccessMark({ pending }) {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className={cn('mx-auto flex h-24 w-24 items-center justify-center rounded-full ring-8 sm:h-28 sm:w-28', pending ? 'bg-white text-ink-700 ring-brand-50' : 'bg-brand-500 text-white ring-brand-100')}
    >
      {pending ? (
        <Spinner className="h-10 w-10 text-brand-500" label="Confirming payment" />
      ) : (
        <motion.span initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.15 }}>
          <Check size={48} strokeWidth={3} aria-hidden="true" />
        </motion.span>
      )}
    </motion.div>
  );
}

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const [timedOut, setTimedOut] = useState(false);

  const { data: order, isLoading, isError, error, refetch } = useOrder(orderId, {
    refetchInterval: (query) => (!timedOut && awaitingPayment(query.state.data) ? POLL_EVERY : false),
    staleTime: 0,
  });

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    const t = setTimeout(() => setTimedOut(true), CONFIRM_TIMEOUT);
    return () => clearTimeout(t);
  }, []);

  if (!orderId) {
    return (
      <div className="container-page py-8">
        <Seo title="Order" noindex />
        <EmptyState className="rounded-2xl border border-line bg-white px-6" icon={<ShoppingBag size={28} strokeWidth={1.6} />} title="No order to show" description="Find all your purchases in your account." action={<Button to="/account/orders">View My Orders</Button>} />
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="container-page max-w-3xl py-12 text-center" aria-busy="true">
        <Skeleton className="mx-auto h-24 w-24 rounded-full" />
        <Skeleton className="mx-auto mt-6 h-8 w-64" />
        <Skeleton className="mx-auto mt-3 h-4 w-48" />
        <Skeleton className="mt-10 h-64 rounded-2xl" />
      </div>
    );
  }
  if (isError || !order) {
    return (
      <div className="container-page py-8">
        <Seo title="Order" noindex />
        <ErrorState error={error} onRetry={refetch} className="rounded-2xl border border-line bg-white px-6" />
      </div>
    );
  }

  if (order.paymentMethod === 'razorpay' && order.paymentStatus === 'failed' && order.canRetryPayment) {
    return <Navigate to={`/checkout/failure?order=${encodeURIComponent(order._id)}`} replace />;
  }

  const pending = awaitingPayment(order);
  const confirming = pending && !timedOut;
  const firstName = order.contact?.name?.split(' ')[0];

  let title = 'Order Placed Successfully!';
  let subtitle = `Thank you${firstName ? `, ${firstName}` : ''}! Your order is confirmed and we are getting it ready.`;
  if (confirming) {
    title = 'Confirming your payment';
    subtitle = 'This usually takes a few seconds. Please keep this page open.';
  } else if (pending) {
    title = 'Your order is placed';
    subtitle = 'We are still waiting for the bank to confirm your payment. We will email you as soon as it is confirmed – no need to pay again.';
  }

  const copyNumber = () =>
    navigator.clipboard
      ?.writeText(order.orderNumber)
      .then(() => toast.success('Order number copied'))
      .catch(() => {});

  return (
    <div className="bg-surface">
      <Seo title="Order confirmed" noindex />
      <div className="container-page max-w-4xl py-6 sm:py-10">
        <div className="rounded-2xl border border-line bg-white px-3 py-4 sm:px-8 sm:py-5">
          <CheckoutStepper stage={pending ? 'payment' : 'success'} className="mx-auto max-w-2xl" />
        </div>

        <header className="mt-4 rounded-2xl border border-line bg-white px-5 py-10 text-center sm:mt-6 sm:py-12" aria-live="polite">
          <SuccessMark pending={confirming} />
          <h1 className="mt-7 font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-500 sm:text-base">{subtitle}</p>
          <div className="mt-5 inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-xl border border-dashed border-brand-300 bg-brand-50 py-1.5 pr-1.5 pl-4">
            <span className="text-sm text-ink-600">Order Number:</span>
            <span className="font-mono text-base font-bold tracking-wide break-all text-brand-600">{order.orderNumber}</span>
            {navigator.clipboard && (
              <button type="button" onClick={copyNumber} className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-600 hover:bg-white" aria-label="Copy order number">
                <Copy size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <Button to={`/account/orders/${order._id}`} size="lg" className="sm:min-w-48" rightIcon={<ArrowRight size={18} aria-hidden="true" />}>
              {pending ? 'View Order Status' : 'Track Order'}
            </Button>
            <Button to="/shop" size="lg" variant="outline" className="sm:min-w-48">
              Continue Shopping
            </Button>
          </div>
        </header>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 *:min-w-0">
          {[
            { icon: Mail, label: 'Confirmation sent to', value: order.contact?.email },
            { icon: Package, label: 'Payment method', value: PAYMENT_METHOD_LABELS[order.paymentMethod] },
            {
              icon: Clock,
              label: 'Estimated delivery',
              value: order.tracking?.estimatedDelivery ? formatDate(order.tracking.estimatedDelivery) : 'We’ll email tracking details',
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-500">{label}</p>
                <p className="truncate text-sm font-semibold text-ink-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-4 rounded-2xl border border-line bg-white p-5 sm:p-6" aria-labelledby="order-summary-heading">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
            <h2 id="order-summary-heading" className="font-display text-lg font-semibold">
              Order Summary
            </h2>
            <PaymentStatusBadge status={order.paymentStatus} method={order.paymentMethod} />
          </div>
          <OrderItemsList items={order.items} compact />
          <div className="mt-4 grid grid-cols-1 gap-6 border-t border-line pt-5 sm:grid-cols-2 *:min-w-0">
            <div>
              <h3 className="mb-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">Delivering to</h3>
              <AddressLines address={order.shippingAddress} />
            </div>
            <OrderPriceSummary pricing={order.pricing} couponCode={order.coupon?.code} />
          </div>
        </section>
      </div>
    </div>
  );
}
