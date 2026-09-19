import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Modal, Switch, Textarea } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import { cn } from '@/utils/cn';
import { useSaveCoupon } from '../../hooks/useCoupons';
import { CharCount } from '../FormSection';
import { couponFormSchema, toCouponFormValues, toCouponPayload } from './couponSchema';

const FORM_ID = 'coupon-form';
const TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed amount' },
];

function DiscountTypeToggle({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Discount type" className="inline-flex w-full rounded-xl border border-line bg-surface p-1 sm:w-auto">
      {TYPES.map((t) => (
        <button
          key={t.value}
          type="button"
          role="radio"
          aria-checked={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'flex-1 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none',
            value === t.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function CouponForm({ coupon, onSaved, save }) {
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(couponFormSchema), defaultValues: toCouponFormValues(coupon) });

  const [discountType, description, isActive, startsAt] = useWatch({
    control,
    name: ['discountType', 'description', 'isActive', 'startsAt'],
  });
  const isPercentage = discountType === 'percentage';
  const codeField = register('code');

  const onSubmit = (values) =>
    save.mutate(
      { id: coupon?._id, input: toCouponPayload(values) },
      { onSuccess: onSaved, onError: (err) => applyFieldErrors(err, setError) },
    );

  return (
    <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <Input
          label="Code"
          required
          autoComplete="off"
          spellCheck={false}
          inputClassName="font-mono uppercase tracking-wide"
          hint="Letters, numbers, - and _"
          error={errors.code?.message}
          {...codeField}
          onChange={(e) => {
            const upper = e.target.value.toUpperCase().replace(/\s+/g, '');
            setValue('code', upper, { shouldDirty: true, shouldValidate: Boolean(errors.code) });
          }}
        />
        <div className="flex items-end pb-1 sm:pb-3">
          <Switch
            checked={isActive}
            onChange={(v) => setValue('isActive', v, { shouldDirty: true })}
            label="Active"
            description="Inactive coupons cannot be redeemed."
          />
        </div>
      </div>

      <div>
        <Textarea label="Description" rows={2} hint="Internal note, also shown to shoppers in the coupon list." error={errors.description?.message} {...register('description')} />
        <div className="mt-1 flex justify-end">
          <CharCount value={description} max={300} />
        </div>
      </div>

      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-medium text-ink-800">Discount</legend>
        <DiscountTypeToggle value={discountType} onChange={(v) => setValue('discountType', v, { shouldDirty: true, shouldValidate: Boolean(errors.discountValue) })} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <Input
            label={isPercentage ? 'Discount (%)' : 'Discount amount (₹)'}
            type="number"
            inputMode="decimal"
            min="0"
            max={isPercentage ? 100 : undefined}
            step="any"
            required
            error={errors.discountValue?.message}
            {...register('discountValue')}
          />
          {isPercentage && (
            <Input
              label="Maximum discount (₹)"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              hint="0 = no cap"
              error={errors.maxDiscount?.message}
              {...register('maxDiscount')}
            />
          )}
          <Input
            label="Minimum order (₹)"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            hint="0 = no minimum"
            error={errors.minOrderAmount?.message}
            {...register('minOrderAmount')}
          />
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <Input label="Starts" type="datetime-local" error={errors.startsAt?.message} {...register('startsAt')} />
        <Input
          label="Expires"
          type="datetime-local"
          required
          min={startsAt || undefined}
          error={errors.expiresAt?.message}
          {...register('expiresAt')}
        />
        <Input
          label="Total usage limit"
          type="number"
          inputMode="numeric"
          min="0"
          step="1"
          hint="0 = unlimited"
          error={errors.usageLimit?.message}
          {...register('usageLimit')}
        />
        <Input
          label="Uses per customer"
          type="number"
          inputMode="numeric"
          min="1"
          max="100"
          step="1"
          required
          error={errors.perUserLimit?.message}
          {...register('perUserLimit')}
        />
      </div>
    </form>
  );
}

/** Create / edit coupon. `coupon` null = create. */
export function CouponFormModal({ open, coupon, onClose }) {
  const save = useSaveCoupon();
  const editing = Boolean(coupon);
  return (
    <Modal
      open={open}
      onClose={save.isPending ? () => {} : onClose}
      size="lg"
      title={editing ? `Edit ${coupon.code}` : 'Create coupon'}
      description={editing ? 'Changes apply to future checkouts only.' : 'Create a discount code shoppers can apply at checkout.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={save.isPending}>
            {editing ? 'Save changes' : 'Create coupon'}
          </Button>
        </>
      }
    >
      <CouponForm key={coupon?._id ?? 'new'} coupon={coupon} save={save} onSaved={onClose} />
    </Modal>
  );
}
