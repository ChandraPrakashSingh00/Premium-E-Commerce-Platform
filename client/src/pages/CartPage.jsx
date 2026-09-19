import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, ArrowLeft, ArrowRight, Heart, Info, Lock, ShieldCheck, ShoppingCart } from 'lucide-react';
import { CartLineItem } from '@/components/cart/CartLineItem';
import { checkoutPath } from '@/components/cart/checkoutPath';
import { CouponBox } from '@/components/cart/CouponBox';
import { FreeShippingProgress } from '@/components/cart/FreeShippingProgress';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { Seo } from '@/components/common/Seo';
import { ProductRail } from '@/components/product/ProductRail';
import { Breadcrumb, Button, ConfirmationModal, ErrorState, Skeleton, SkeletonText } from '@/components/ui';
import { useCart } from '@/features/cart/useCart';
import { useRelatedProducts } from '@/features/products/hooks';
import { toast } from '@/store/toastStore';
import { formatPrice } from '@/utils/format';

function CartSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] *:min-w-0" aria-busy="true" aria-label="Loading cart">
      <div className="divide-y divide-line rounded-2xl border border-line bg-white px-4 sm:px-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex gap-4 py-5">
            <Skeleton className="aspect-square w-20 rounded-lg sm:w-24" />
            <SkeletonText className="flex-1" lines={3} />
          </div>
        ))}
      </div>
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-white px-6 py-14 text-center sm:py-20">
      <div className="relative mb-6">
        <span className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-50">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-500">
            <ShoppingCart size={36} strokeWidth={1.6} aria-hidden="true" />
          </span>
        </span>
        <span className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-brand-500 text-xs font-bold text-white">0</span>
      </div>
      <h2 className="font-display text-xl font-semibold sm:text-2xl">Your cart is empty</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">Looks like you haven’t added anything yet. Explore our latest arrivals and best sellers.</p>
      <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        <Button to="/shop" size="lg" rightIcon={<ArrowRight size={18} aria-hidden="true" />}>
          Continue Shopping
        </Button>
        <Button to="/wishlist" size="lg" variant="outline" leftIcon={<Heart size={18} aria-hidden="true" />}>
          View Wishlist
        </Button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const cart = useCart();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { items, summary, isGuest, isLoading, isError, error, refetch } = cart;
  const hasIssues = cart.cart.hasIssues;
  const goCheckout = () => navigate(checkoutPath(isGuest));
  const related = useRelatedProducts(items[0]?.slug, { enabled: items.length > 0 });
  const count = summary.itemCount || items.length;
  const ctaLabel = isGuest ? 'Sign in & Checkout' : 'Proceed to Checkout';

  const clearAll = async () => {
    setClearing(true);
    try {
      await cart.clearCart();
      setConfirmClear(false);
    } catch (err) {
      toast.error('Could not clear your cart', err?.message);
    } finally {
      setClearing(false);
    }
  };

  let content;
  if (isLoading && !items.length) content = <CartSkeleton />;
  else if (isError && !items.length) content = <ErrorState error={error} onRetry={refetch} className="rounded-2xl border border-line bg-white" />;
  else if (!items.length) content = <EmptyCart />;
  else {
    content = (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 *:min-w-0">
        <section aria-label="Items in your cart" className="space-y-4">
          {hasIssues && (
            <div className="flex items-start gap-3 rounded-xl border border-danger-500/20 bg-danger-50 p-4 text-sm text-danger-600" role="alert">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">Some items need your attention</p>
                <p className="mt-0.5">Remove unavailable items or reduce quantities before you check out.</p>
              </div>
            </div>
          )}
          <div className="rounded-2xl border border-line bg-white">
            <div className="hidden items-center gap-4 border-b border-line px-6 py-3 text-xs font-semibold tracking-wide text-ink-500 uppercase sm:flex">
              <span className="flex-1">Product</span>
              <span className="w-24 text-right lg:w-28">Price</span>
              <span className="w-28 text-center">Quantity</span>
              <span className="w-24 text-right">Total</span>
              <span className="w-10" aria-hidden="true" />
            </div>
            <ul className="divide-y divide-line px-4 sm:px-6">
              {items.map((item) => (
                <li key={item._id}>
                  <CartLineItem item={item} onQuantity={cart.updateItem} onRemove={cart.removeItem} disabled={cart.isMutating} />
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button to="/shop" variant="link" leftIcon={<ArrowLeft size={16} aria-hidden="true" />} className="min-h-11">
              Continue Shopping
            </Button>
            {isGuest && (
              <p className="flex items-start gap-2 text-xs text-ink-500">
                <Info size={14} className="mt-px shrink-0" aria-hidden="true" />
                Prices are a live preview. Sign in at checkout to lock in your cart.
              </p>
            )}
          </div>
        </section>

        <aside aria-label="Order summary" className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-semibold">Order Summary</h2>
            <OrderSummary summary={summary} coupon={cart.cart.coupon} className="mt-5" />
            <Button size="lg" fullWidth className="mt-5" disabled={hasIssues} onClick={goCheckout} rightIcon={<ArrowRight size={18} aria-hidden="true" />}>
              {ctaLabel}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-500">
              <ShieldCheck size={14} className="text-success-600" aria-hidden="true" />
              Safe & secure payments · Easy returns
            </p>
            <div className="mt-5 border-t border-line pt-5">
              <CouponBox cart={cart.cart} applyCoupon={cart.applyCoupon} removeCoupon={cart.removeCoupon} applying={cart.isApplyingCoupon} />
            </div>
          </div>
          <FreeShippingProgress summary={summary} />
        </aside>
      </div>
    );
  }

  return (
    <div className={items.length ? 'bg-surface pb-20 lg:pb-0' : 'bg-surface'}>
      <Seo title="Your cart" noindex />
      <div className="container-page pt-4 pb-10 sm:pt-6 lg:pb-14">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
        <div className="mt-3 mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Your Cart{items.length > 0 && <span className="text-ink-400"> ({count})</span>}
          </h1>
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={cart.isMutating}
              className="min-h-11 rounded-lg px-2 text-sm font-semibold text-danger-600 hover:bg-danger-50 disabled:opacity-50"
            >
              Clear Cart
            </button>
          )}
        </div>
        {content}
      </div>

      {items.length > 0 && (
        <ProductRail
          title="You May Also Like"
          items={related.data ?? []}
          loading={related.isPending}
          error={related.isError ? related.error : null}
          onRetry={() => related.refetch()}
          viewAllTo="/shop"
          className="pt-4! pb-10! sm:pt-6! lg:pb-16!"
        />
      )}

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white shadow-[0_-4px_16px_rgb(16_24_40/0.06)] lg:hidden">
          <div className="container-page flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-ink-500">
                Total · {count} {count === 1 ? 'item' : 'items'}
              </p>
              <p className="font-display text-lg font-bold text-ink-900 tabular-nums">{formatPrice(summary.total)}</p>
            </div>
            <Button size="lg" className="min-w-0 shrink! px-4! sm:px-7!" disabled={hasIssues} onClick={goCheckout} leftIcon={<Lock size={16} aria-hidden="true" />}>
              Checkout
            </Button>
          </div>
        </div>
      )}

      <ConfirmationModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearAll}
        loading={clearing}
        title="Clear your cart?"
        description={`All ${count} ${count === 1 ? 'item' : 'items'} will be removed from your cart.`}
        confirmLabel="Clear Cart"
      >
        <p className="text-sm text-ink-600">You can always add them again later.</p>
      </ConfirmationModal>
    </div>
  );
}
