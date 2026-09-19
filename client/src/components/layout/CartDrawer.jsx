import { useNavigate } from 'react-router';
import { AlertTriangle, ArrowRight, ShieldCheck, ShoppingCart } from 'lucide-react';
import { CartLineItem } from '@/components/cart/CartLineItem';
import { checkoutPath } from '@/components/cart/checkoutPath';
import { FreeShippingProgress } from '@/components/cart/FreeShippingProgress';
import { Button, Drawer, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { useCart } from '@/features/cart/useCart';
import { useUiStore } from '@/store/uiStore';
import { formatPrice } from '@/utils/format';

function DrawerSkeleton() {
  return (
    <div className="space-y-5 px-5 py-5" aria-hidden="true">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-24 w-24 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CartDrawer() {
  const open = useUiStore((s) => s.overlay === 'cart');
  const close = useUiStore((s) => s.close);
  const navigate = useNavigate();
  const { items, summary, cart, itemCount, isGuest, isLoading, isError, error, refetch, updateItem, removeItem, isMutating } = useCart();

  const empty = !isLoading && !isError && items.length === 0;
  const goTo = (path) => {
    close();
    navigate(path);
  };

  let body;
  if (isLoading && items.length === 0) body = <DrawerSkeleton />;
  else if (isError && items.length === 0) body = <ErrorState error={error} onRetry={refetch} compact />;
  else if (empty) {
    body = (
      <EmptyState
        icon={<ShoppingCart size={28} strokeWidth={1.5} />}
        title="Your cart is empty"
        description="Looks like you haven’t added anything yet. Discover something you love."
        action={<Button onClick={() => goTo('/shop')}>Continue Shopping</Button>}
      />
    );
  } else {
    body = (
      <div className="px-5 py-4">
        <FreeShippingProgress summary={summary} />
        {cart.hasIssues && (
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-danger-50 p-3 text-sm text-danger-600" role="alert">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
            Some items need your attention before checkout.
          </p>
        )}
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item._id}>
              <CartLineItem item={item} size="sm" onQuantity={updateItem} onRemove={removeItem} disabled={isMutating} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <Drawer
      open={open}
      onClose={close}
      title={itemCount ? `Your Cart (${itemCount})` : 'Your Cart'}
      footer={
        items.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-ink-600">Subtotal</span>
              <span className="font-display text-xl font-bold tabular-nums">{formatPrice(summary.subtotal)}</span>
            </div>
            <p className="-mt-3 text-xs text-ink-400">Taxes, shipping and coupons are applied at checkout.</p>
            <div className="grid gap-2.5">
              <Button fullWidth disabled={cart.hasIssues} onClick={() => goTo(checkoutPath(isGuest))} rightIcon={<ArrowRight size={18} />}>
                Proceed to Checkout
              </Button>
              <Button variant="outline" fullWidth onClick={() => goTo('/cart')}>
                View Cart
              </Button>
            </div>
            <p className="flex items-center justify-center gap-1.5 text-xs text-ink-400">
              <ShieldCheck size={14} className="text-success-600" aria-hidden="true" /> Secure checkout powered by Razorpay
            </p>
          </div>
        )
      }
    >
      {body}
    </Drawer>
  );
}
