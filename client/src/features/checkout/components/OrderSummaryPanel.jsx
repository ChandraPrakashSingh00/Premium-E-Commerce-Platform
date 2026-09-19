import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Lock, ShoppingBag } from 'lucide-react';
import { Button, SmartImage, Spinner } from '@/components/ui';
import { OrderPriceSummary } from '@/features/orders/components';
import { cn } from '@/utils/cn';
import { formatPrice, pluralize } from '@/utils/format';
import { checkoutCta } from '../progress';
import { STEP_FORM_ID } from '../useCheckout';
import { CouponForm } from './CouponForm';
import { TrustBadges } from './TrustBadges';

function MiniItems({ items }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 3);
  return (
    <div>
      <ul className="space-y-3">
        {visible.map((item) => (
          <li key={item._id} className="flex items-center gap-3">
            <div className="relative shrink-0">
              <SmartImage src={item.image} alt="" width={120} className="h-14 w-14 rounded-lg border border-line" />
              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {item.quantity}
                <span className="sr-only"> ×</span>
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm leading-snug font-medium text-ink-900">{item.name}</p>
              <p className="mt-0.5 text-xs text-ink-500">
                {[item.size, item.color].filter(Boolean).join(' · ') || item.brandName} · Qty {item.quantity}
              </p>
            </div>
            <p className="shrink-0 text-sm font-semibold text-ink-900 tabular-nums">{formatPrice(item.lineSubtotal)}</p>
          </li>
        ))}
      </ul>
      {items.length > 3 && (
        <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-3 min-h-9 text-xs font-semibold text-brand-600 hover:underline">
          {expanded ? 'Show less' : `+ ${items.length - 3} more ${items.length - 3 === 1 ? 'item' : 'items'}`}
        </button>
      )}
    </div>
  );
}

function PanelBody({ checkout, updating }) {
  const { items, cart, quoteSummary, applyCoupon, removeCoupon, isApplyingCoupon, isPlacing } = checkout;
  return (
    <div className="space-y-5">
      <MiniItems items={items} />
      <div className="border-t border-line pt-5">
        <CouponForm
          coupon={cart.coupon}
          couponError={cart.couponError}
          applyCoupon={applyCoupon}
          removeCoupon={removeCoupon}
          isApplying={isApplyingCoupon}
          disabled={isPlacing}
        />
      </div>
      <div className={cn('border-t border-line pt-5 transition-opacity', updating && 'opacity-60')} aria-busy={updating || undefined}>
        <OrderPriceSummary pricing={quoteSummary} couponCode={cart.coupon?.code} itemCount={quoteSummary?.itemCount} />
        {quoteSummary?.amountToFreeShipping > 0 && (
          <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-xs text-ink-700">
            Add <span className="font-semibold text-brand-600">{formatPrice(quoteSummary.amountToFreeShipping)}</span> more for free shipping.
          </p>
        )}
      </div>
    </div>
  );
}

/** Mobile / tablet: collapsible disclosure showing the live total. */
export function OrderSummaryDisclosure({ checkout }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { quoteSummary, quote, items } = checkout;
  const updating = quote.isFetching;

  return (
    <div className="rounded-2xl border border-line bg-white lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3"
      >
        <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-brand-600">
          <ShoppingBag size={18} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
          <span className="truncate">
            {open ? 'Hide' : 'Show'}<span className="hidden min-[360px]:inline"> order</span> summary
          </span>
          <span className="hidden font-normal text-ink-500 min-[400px]:inline">({pluralize(quoteSummary?.itemCount ?? items.length, 'item')})</span>
          <ChevronDown size={16} className={cn('shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
        </span>
        <span className="flex shrink-0 items-center gap-2 font-display text-base font-bold text-ink-900 tabular-nums">
          {updating && <Spinner className="text-ink-400" label="Updating total" />}
          {formatPrice(quoteSummary?.total)}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-line px-4 py-5">
              <PanelBody checkout={checkout} updating={updating} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Desktop: sticky summary card with the primary CTA (submits the active step form). */
export function OrderSummaryPanel({ checkout }) {
  const updating = checkout.quote.isFetching;
  const cta = checkoutCta(checkout);
  const total = checkout.quoteSummary?.total ?? 0;
  return (
    <aside aria-label="Order summary" className="sticky top-24">
      <div className="rounded-2xl border border-line bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Order Summary</h2>
          {updating && <Spinner className="text-ink-400" label="Updating total" />}
        </div>
        <PanelBody checkout={checkout} updating={updating} />
        <Button
          type="submit"
          form={STEP_FORM_ID}
          size="lg"
          fullWidth
          className="mt-6 h-13!"
          loading={checkout.isPlacing}
          disabled={cta.disabled}
          leftIcon={cta.final ? <Lock size={17} aria-hidden="true" /> : undefined}
          rightIcon={cta.final ? undefined : <ArrowRight size={18} aria-hidden="true" />}
        >
          {cta.final ? `${cta.label} · ${formatPrice(total)}` : cta.label}
        </Button>
      </div>
      <TrustBadges compact className="mt-4" />
    </aside>
  );
}
