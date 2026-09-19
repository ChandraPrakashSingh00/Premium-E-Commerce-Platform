import { Lock } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatPrice } from '@/utils/format';
import { checkoutCta } from '../progress';
import { STEP_FORM_ID } from '../useCheckout';

/** Fixed bottom action bar for phones/tablets – submits the active step form. */
export function CheckoutMobileBar({ checkout }) {
  const { quoteSummary, isPlacing } = checkout;
  const total = quoteSummary?.total ?? 0;
  const cta = checkoutCta(checkout);

  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-60 border-t border-line bg-white shadow-[0_-4px_16px_rgb(16_24_40/0.06)] lg:hidden">
      <div className="container-page flex items-center gap-3 py-2.5">
        <div className="min-w-0 shrink-0">
          <p className="text-[11px] font-medium text-ink-500">Total</p>
          <p className="font-display text-lg leading-tight font-bold text-ink-900 tabular-nums">{formatPrice(total)}</p>
        </div>
        <Button
          type="submit"
          form={STEP_FORM_ID}
          size="lg"
          className="min-w-0 flex-1 shrink! px-3! sm:ml-auto sm:max-w-sm sm:flex-none sm:px-8!"
          loading={isPlacing}
          disabled={cta.disabled}
          leftIcon={cta.final ? <Lock size={16} aria-hidden="true" /> : undefined}
        >
          <span className="min-w-0 truncate sm:hidden">{cta.shortLabel}</span>
          <span className="hidden min-w-0 truncate sm:inline">{cta.label}</span>
        </Button>
      </div>
    </div>
  );
}
