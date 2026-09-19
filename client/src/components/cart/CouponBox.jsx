import { useState } from 'react';
import { Tag, TicketPercent, X } from 'lucide-react';
import { Button, controlClasses } from '@/components/ui';
import { describeCoupon, useAvailableCoupons } from '@/features/cart/useAvailableCoupons';
import { cn } from '@/utils/cn';
import { formatDate, formatPrice } from '@/utils/format';

/**
 * Coupon entry + applied coupon + available offers.
 * Props: `cart` (CartView), `applyCoupon(code)`, `removeCoupon()`, `applying`.
 */
export function CouponBox({ cart, applyCoupon, removeCoupon, applying }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);
  const { data: coupons = [] } = useAvailableCoupons();

  const apply = async (value) => {
    const next = value.trim().toUpperCase();
    if (!next) {
      setError('Enter a coupon code');
      return;
    }
    setError('');
    try {
      const result = await applyCoupon(next);
      if (result?.couponError) setError(result.couponError);
      else setCode('');
    } catch (err) {
      setError(err?.message || 'This coupon could not be applied.');
    }
  };

  const remove = async () => {
    setRemoving(true);
    try {
      await removeCoupon();
    } finally {
      setRemoving(false);
    }
  };

  const applied = cart.coupon;
  const offers = coupons.filter((c) => c.code !== applied?.code).slice(0, 4);

  return (
    <div>
      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-success-600/40 bg-success-50 p-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <Tag size={16} className="mt-0.5 shrink-0 text-success-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-semibold break-all text-ink-900">
                <span className="font-mono tracking-wider">{applied.code}</span> applied
              </p>
              <p className="text-xs text-success-600">You save {formatPrice(applied.discountAmount)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={removing}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-white hover:text-danger-600 disabled:opacity-50"
            aria-label={`Remove coupon ${applied.code}`}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            apply(code);
          }}
          noValidate
        >
          <label htmlFor="coupon-code" className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <TicketPercent size={16} className="text-brand-500" aria-hidden="true" />
            Apply Coupon
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="coupon-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              autoComplete="off"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'coupon-error' : undefined}
              className={cn(controlClasses(Boolean(error)), 'h-11 min-w-0 flex-1 bg-surface font-mono tracking-wider uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case')}
            />
            <Button type="submit" variant="outline" loading={applying} className="px-4!">
              Apply
            </Button>
          </div>
        </form>
      )}
      {(error || cart.couponError) && (
        <p id="coupon-error" role="alert" className="mt-2 text-xs font-medium text-danger-600">
          {error || cart.couponError}
        </p>
      )}

      {offers.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-ink-500">Available coupons</p>
          <ul className="mt-2 space-y-2">
            {offers.map((c) => (
              <li key={c.code} className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-brand-200 bg-brand-50/50 p-2.5 pl-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <TicketPercent size={16} className="mt-0.5 shrink-0 text-brand-500" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold tracking-wider break-all text-brand-600">{c.code}</p>
                    <p className="text-xs text-ink-500">{c.description || describeCoupon(c, formatPrice)}</p>
                    {c.expiresAt && <p className="mt-0.5 text-[11px] text-ink-400">Valid till {formatDate(c.expiresAt)}</p>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => apply(c.code)}
                  aria-label={`Apply coupon ${c.code}`}
                  disabled={applying}
                  className="min-h-9 shrink-0 rounded-md bg-white px-3 text-xs font-bold text-brand-600 ring-1 ring-brand-200 hover:bg-brand-500 hover:text-white disabled:opacity-50"
                >
                  Apply
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CouponBox;
