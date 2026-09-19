import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Lock, MapPin, PackageCheck, ShoppingCart, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, EmptyState, ErrorState, Skeleton, Spinner } from '@/components/ui';
import { useAddresses } from '@/features/account/hooks';
import { AddressStep } from '@/features/checkout/components/AddressStep';
import { CheckoutMobileBar } from '@/features/checkout/components/CheckoutMobileBar';
import { CheckoutStepper } from '@/features/checkout/components/CheckoutStepper';
import { ContactStep, ContactSummary } from '@/features/checkout/components/ContactStep';
import { OrderSummaryDisclosure, OrderSummaryPanel } from '@/features/checkout/components/OrderSummaryPanel';
import { PaymentStep } from '@/features/checkout/components/PaymentStep';
import { CartIssuesBanner, ReviewStep } from '@/features/checkout/components/ReviewStep';
import { StepSection } from '@/features/checkout/components/StepSection';
import { TrustBadges } from '@/features/checkout/components/TrustBadges';
import { STAGE_ENTRY_STEP, stageForStep } from '@/features/checkout/progress';
import { useCheckout } from '@/features/checkout/useCheckout';
import { resolveSelectedAddress } from '@/features/checkout/utils';
import { pluralize } from '@/utils/format';

function CheckoutSkeleton() {
  return (
    <div className="bg-surface">
      <div className="container-page py-6 sm:py-8" aria-busy="true" aria-label="Loading checkout">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-5 h-24 rounded-2xl" />
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px] *:min-w-0">
          <div className="space-y-4">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
          <Skeleton className="hidden h-120 rounded-2xl lg:block" />
        </div>
      </div>
    </div>
  );
}

function PaymentOverlay({ phase }) {
  return (
    <AnimatePresence>
      {(phase === 'creating' || phase === 'paying') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-75 flex items-center justify-center bg-white/85 px-6 backdrop-blur-sm"
          role="status"
          aria-live="assertive"
        >
          <div className="rounded-2xl border border-line bg-white px-8 py-7 text-center shadow-lift">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
              <Spinner className="h-7 w-7 text-brand-500" />
            </span>
            <p className="mt-4 font-display text-lg font-semibold text-ink-900">
              {phase === 'creating' ? 'Placing your order…' : 'Waiting for payment…'}
            </p>
            <p className="mt-1 text-sm text-ink-500">
              {phase === 'creating' ? 'Please don’t refresh or close this page.' : 'Complete the payment in the secure Razorpay window.'}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CheckoutPage() {
  const checkout = useCheckout();
  const { data: addresses = [] } = useAddresses();
  const { step, maxStep, goTo, items, isLoading, isError, error, refetch, phase, hasIssues } = checkout;
  const selectedAddress = resolveSelectedAddress(addresses, checkout.addressId);

  if (isLoading && phase === 'idle') return <CheckoutSkeleton />;
  const stage = stageForStep(step);
  const selectStage = (key) => goTo(STAGE_ENTRY_STEP[key]);

  if (isError && !items.length) {
    return (
      <div className="bg-surface">
        <Seo title="Checkout" noindex />
        <div className="container-page py-8">
          <ErrorState error={error} onRetry={refetch} className="rounded-2xl border border-line bg-white" />
        </div>
      </div>
    );
  }
  if (!items.length && phase === 'idle') {
    return (
      <div className="bg-surface">
        <Seo title="Checkout" noindex />
        <div className="container-page py-8">
          <EmptyState
            className="rounded-2xl border border-line bg-white px-6"
            icon={<ShoppingCart size={28} strokeWidth={1.6} />}
            title="Your cart is empty"
            description="Add a few favourites to your cart and come back to check out."
            action={<Button to="/shop">Continue Shopping</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface pb-24 lg:pb-0">
      <Seo title="Checkout" noindex />
      <div className="container-page py-5 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link to="/cart" className="mb-1 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-brand-600">
              <ArrowLeft size={16} aria-hidden="true" /> Back to cart
            </Link>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">Checkout</h1>
          </div>
          <p className="hidden items-center gap-1.5 rounded-full bg-success-50 px-3 py-1.5 text-xs font-semibold text-success-600 sm:flex">
            <Lock size={13} aria-hidden="true" /> 100% Secure Checkout
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-white px-3 py-4 sm:mt-6 sm:px-8 sm:py-5">
          <CheckoutStepper stage={stage} onSelect={checkout.isPlacing ? undefined : selectStage} className="mx-auto max-w-3xl" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6 xl:gap-8 *:min-w-0">
          <div className="min-w-0 space-y-4">
            <OrderSummaryDisclosure checkout={checkout} />
            {hasIssues && step < 3 && <CartIssuesBanner items={items} />}

            <StepSection
              number={1}
              icon={UserRound}
              title="Customer Information"
              active={step === 1}
              completed={maxStep > 1}
              onEdit={() => goTo(1)}
              disabled={checkout.isPlacing}
              summary={<ContactSummary contact={checkout.contact} />}
            >
              <ContactStep contact={checkout.contact} user={checkout.user} onSubmit={checkout.submitContact} />
            </StepSection>

            <StepSection
              number={2}
              icon={MapPin}
              title="Shipping Address"
              active={step === 2}
              completed={maxStep > 2}
              onEdit={() => goTo(2)}
              disabled={checkout.isPlacing}
              summary={
                selectedAddress && (
                  <span className="block wrap-break-word">
                    {selectedAddress.fullName} · {selectedAddress.addressLine1}, {selectedAddress.city} {selectedAddress.postalCode}
                  </span>
                )
              }
            >
              <AddressStep
                addressId={checkout.addressId}
                onSelect={checkout.setAddressId}
                onConfirm={checkout.confirmAddress}
                adding={checkout.addingAddress}
                setAdding={checkout.setAddingAddress}
                contact={checkout.contact}
              />
            </StepSection>

            <StepSection
              number={3}
              icon={PackageCheck}
              title="Review Items"
              active={step === 3}
              completed={maxStep > 3}
              onEdit={() => goTo(3)}
              disabled={checkout.isPlacing}
              summary={<span>{pluralize(checkout.quoteSummary?.itemCount ?? items.length, 'item')} ready to ship</span>}
            >
              <ReviewStep items={items} hasIssues={hasIssues} onConfirm={checkout.confirmReview} quoteLoading={checkout.quote.isLoading} />
            </StepSection>

            <StepSection number={4} icon={CreditCard} title="Payment Method" active={step === 4} completed={false}>
              <PaymentStep checkout={checkout} />
            </StepSection>

            <TrustBadges className="lg:hidden" />
          </div>

          <div className="hidden lg:block">
            <OrderSummaryPanel checkout={checkout} />
          </div>
        </div>
      </div>

      <CheckoutMobileBar checkout={checkout} />
      <PaymentOverlay phase={phase} />
    </div>
  );
}
