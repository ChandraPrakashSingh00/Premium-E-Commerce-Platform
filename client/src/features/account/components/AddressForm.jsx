import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button, Checkbox, Input, Select } from '@/components/ui';
import { INDIAN_STATES } from '@/constants';
import { applyFieldErrors } from '@/services/apiClient';
import { cn } from '@/utils/cn';
import { ADDRESS_LABELS, addressSchema, EMPTY_ADDRESS } from '@/validators/account';
import { FormAlert } from './FormAlert';

const STATE_OPTIONS = INDIAN_STATES.map((s) => ({ value: s, label: s }));

const toFormValues = (address) => {
  const values = { ...EMPTY_ADDRESS };
  for (const key of Object.keys(EMPTY_ADDRESS)) {
    if (address?.[key] !== undefined && address?.[key] !== null) values[key] = address[key];
  }
  return values;
};

function LabelPicker({ value, onChange }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink-800">Save as</legend>
      <div className="flex gap-2">
        {ADDRESS_LABELS.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'inline-flex min-h-10 cursor-pointer items-center rounded-lg border px-4 text-sm font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-500',
              value === opt.value ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-line text-ink-700 hover:border-brand-300',
            )}
          >
            <input type="radio" className="sr-only" name="address-label" value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Indian address form. `onSubmit(values)` may throw an ApiError – field errors are mapped inline.
 * Pass `formId` + `hideActions` to render the submit button elsewhere (modal footer / sticky bar).
 */
export function AddressForm({
  address,
  onSubmit,
  onCancel,
  submitLabel = 'Save address',
  showDefaultToggle = true,
  formId,
  hideActions = false,
  actionsClassName,
  className,
}) {
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(addressSchema), defaultValues: toFormValues(address) });

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch (error) {
      if (!applyFieldErrors(error, setError)) setError('root', { message: error.message });
    }
  });

  return (
    <form id={formId} onSubmit={submit} noValidate className={cn('space-y-4', className)} aria-busy={isSubmitting || undefined}>
      <FormAlert message={errors.root?.message} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <Input label="Full name" required autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
        <Input
          label="Mobile number"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="10-digit mobile"
          hint="For delivery updates"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>
      <Input
        label="Address"
        required
        autoComplete="address-line1"
        placeholder="House / flat no., building, street"
        error={errors.addressLine1?.message}
        {...register('addressLine1')}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <Input
          label="Area / locality"
          autoComplete="address-line2"
          placeholder="Optional"
          error={errors.addressLine2?.message}
          {...register('addressLine2')}
        />
        <Input label="Landmark" placeholder="Optional" error={errors.landmark?.message} {...register('landmark')} />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Input
          label="PIN code"
          required
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          error={errors.postalCode?.message}
          {...register('postalCode')}
        />
        <Input label="City" required autoComplete="address-level2" error={errors.city?.message} {...register('city')} />
        <Select
          label="State"
          required
          className="col-span-2 sm:col-span-1"
          placeholder="Select state"
          autoComplete="address-level1"
          options={STATE_OPTIONS}
          error={errors.state?.message}
          {...register('state')}
        />
      </div>
      <Controller control={control} name="label" render={({ field }) => <LabelPicker value={field.value} onChange={field.onChange} />} />
      {showDefaultToggle && !address?.isDefault && <Checkbox label="Make this my default address" {...register('isDefault')} />}

      {!hideActions && (
        <div className={cn('flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end', actionsClassName ?? 'flex')}>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
