import { zodResolver } from '@hookform/resolvers/zod';
import { Tag, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui';
import { controlClasses } from '@/components/ui/controlClasses';
import { toast } from '@/store/toastStore';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';
import { couponSchema } from '@/validators/checkout';

/** Apply / remove a coupon on the server cart (prices re-quoted by the server). */
export function CouponForm({ coupon, couponError, applyCoupon, removeCoupon, isApplying, disabled }) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(couponSchema), defaultValues: { code: '' } });

  if (coupon) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-success-600/40 bg-success-50 px-3.5 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Tag size={16} className="shrink-0 text-success-600" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-mono text-sm font-bold tracking-wider break-all text-ink-900">{coupon.code} <span className="font-sans font-medium tracking-normal text-success-600">applied</span></p>
              {coupon.discountAmount > 0 && <p className="text-xs text-success-600">You save {formatPrice(coupon.discountAmount)}</p>}
            </div>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => removeCoupon().catch((e) => toast.error('Could not remove coupon', e.message))}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-500 hover:bg-white hover:text-danger-600 disabled:opacity-40"
            aria-label={`Remove coupon ${coupon.code}`}
          >
            <X size={16} />
          </button>
        </div>
        {couponError && (
          <p role="alert" className="text-xs font-medium text-danger-600">
            {couponError}
          </p>
        )}
      </div>
    );
  }

  const onSubmit = handleSubmit(async ({ code }) => {
    try {
      await applyCoupon(code);
      reset();
      toast.success('Coupon applied');
    } catch (error) {
      setError('code', { message: error.errors?.[0]?.message || error.message });
    }
  });

  return (
    // Not a <form>: the panel can sit next to the step form on mobile; Enter still submits.
    <div>
      <label htmlFor="checkout-coupon" className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
        <Tag size={15} className="text-brand-500" aria-hidden="true" />
        Coupon Code
      </label>
      <div className="flex gap-2">
        <input
          id="checkout-coupon"
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="Enter code"
          disabled={disabled}
          aria-invalid={errors.code ? true : undefined}
          aria-describedby={errors.code ? 'checkout-coupon-error' : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            }
          }}
          className={cn(controlClasses(Boolean(errors.code)), 'h-11 min-w-0 flex-1 bg-surface font-mono tracking-wider uppercase placeholder:font-sans placeholder:tracking-normal placeholder:normal-case')}
          {...register('code')}
        />
        <Button variant="outline" onClick={onSubmit} loading={isApplying} disabled={disabled} className="px-4!">
          Apply
        </Button>
      </div>
      {errors.code && (
        <p id="checkout-coupon-error" role="alert" className="mt-1.5 text-xs font-medium text-danger-600">
          {errors.code.message}
        </p>
      )}
    </div>
  );
}
