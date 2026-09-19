import { zodResolver } from '@hookform/resolvers/zod';
import { Banknote, CreditCard, ShieldCheck } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Skeleton, Textarea } from '@/components/ui';
import { FormAlert } from '@/features/account/components/FormAlert';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';
import { paymentSchema } from '@/validators/checkout';
import { STEP_FORM_ID } from '../useCheckout';

const PAY_CHIPS = ['UPI', 'Visa', 'Mastercard', 'RuPay', 'NetBanking'];

function MethodOption({ value, checked, disabled, onChange, icon: Icon, title, description, note, children }) {
  return (
    <label
      className={cn(
        'flex gap-3 rounded-xl border-2 p-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500',
        disabled ? 'cursor-not-allowed border-line bg-ink-50' : 'cursor-pointer',
        !disabled && (checked ? 'border-brand-500 bg-brand-50/40' : 'border-line hover:border-brand-200'),
      )}
    >
      <input
        type="radio"
        name="paymentMethod"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="mt-2.5 h-5 w-5 shrink-0 accent-brand-500 focus:outline-none"
      />
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          disabled ? 'bg-ink-100 text-ink-300' : checked ? 'bg-brand-500 text-white' : 'bg-brand-50 text-brand-500',
        )}
      >
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <span className={cn('block text-[15px] font-semibold', disabled ? 'text-ink-400' : 'text-ink-900')}>{title}</span>
        <span className={cn('mt-0.5 block text-sm', disabled ? 'text-ink-400' : 'text-ink-500')}>{description}</span>
        {!disabled && children}
        {note && <span className={cn('mt-2 block text-xs font-medium', disabled ? 'text-warning-600' : 'text-ink-600')}>{note}</span>}
      </div>
    </label>
  );
}

export function PaymentStep({ checkout }) {
  const { settings } = useStoreSettings();
  const { paymentMethod, setPaymentMethod, razorpayEnabled, codEnabled, paymentConfig, quote, blockers, placeOrder, placeError } = checkout;

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(paymentSchema), defaultValues: { paymentMethod, customerNote: '' } });

  const codQuoteUnavailable = quote.data?.codAvailable === false;
  const codDisabled = !codEnabled || codQuoteUnavailable;
  const busy = quote.isFetching && !quote.data;

  if (paymentConfig.isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    );
  }

  let codNote;
  if (!codEnabled) codNote = 'Cash on delivery is currently unavailable.';
  else if (codQuoteUnavailable) codNote = quote.data.codUnavailableReason;
  else if (settings.codFee > 0) codNote = `A ${formatPrice(settings.codFee)} handling fee applies.`;

  return (
    <form id={STEP_FORM_ID} noValidate onSubmit={handleSubmit((values) => placeOrder(values))} className="space-y-5">
      <Controller
        control={control}
        name="paymentMethod"
        render={({ field }) => {
          const change = (value) => {
            field.onChange(value);
            setPaymentMethod(value);
          };
          return (
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-semibold text-ink-900">Select a payment method</legend>
              <MethodOption
                value="razorpay"
                checked={field.value === 'razorpay'}
                disabled={!razorpayEnabled}
                onChange={change}
                icon={CreditCard}
                title="Razorpay"
                description="Cards, UPI, Net Banking, Wallets"
                note={!razorpayEnabled ? 'Online payments are temporarily unavailable.' : undefined}
              >
                <span className="mt-2 flex flex-wrap gap-1.5" aria-hidden="true">
                  {PAY_CHIPS.map((chip) => (
                    <span key={chip} className="rounded border border-line bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-ink-600">
                      {chip}
                    </span>
                  ))}
                </span>
              </MethodOption>
              <MethodOption
                value="cod"
                checked={field.value === 'cod'}
                disabled={codDisabled}
                onChange={change}
                icon={Banknote}
                title="Cash on Delivery"
                description="Pay when you receive"
                note={codNote}
              />
              {errors.paymentMethod && (
                <p role="alert" className="text-xs font-medium text-danger-600">
                  {errors.paymentMethod.message}
                </p>
              )}
            </fieldset>
          );
        }}
      />

      <Textarea
        label="Delivery instructions"
        rows={2}
        placeholder="Optional – e.g. leave with the concierge"
        error={errors.customerNote?.message}
        {...register('customerNote')}
      />

      <FormAlert message={placeError} />
      {!placeError && blockers.length > 0 && !busy && <FormAlert tone="warning" message={blockers[0]} />}

      <p className="flex items-start gap-2 rounded-lg bg-surface px-3.5 py-3 text-xs leading-relaxed text-ink-500">
        <ShieldCheck size={16} className="mt-px shrink-0 text-success-600" aria-hidden="true" />
        <span>
          Payments are encrypted and processed securely. By placing your order you agree to our{' '}
          <Link to="/terms" className="link">
            terms
          </Link>{' '}
          and{' '}
          <Link to="/refund-policy" className="link">
            refund policy
          </Link>
          .
        </span>
      </p>
    </form>
  );
}
