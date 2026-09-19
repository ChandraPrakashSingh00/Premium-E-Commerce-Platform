import { Controller, useWatch } from 'react-hook-form';
import { Input, Switch, Textarea } from '@/components/ui';
import { CharCount, FormSection } from '../FormSection';
import { SOCIAL_KEYS } from './settingsSchema';

const rupee = <span className="text-sm text-ink-500">₹</span>;
const SOCIAL_LABELS = { instagram: 'Instagram', facebook: 'Facebook', twitter: 'X (Twitter)', youtube: 'YouTube' };

function NumberInput({ register, name, errors, ...props }) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      min="0"
      step="any"
      error={errors[name]?.message}
      {...props}
      {...register(name, { valueAsNumber: true })}
    />
  );
}

function SwitchField({ control, name, label, description }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <Switch checked={Boolean(field.value)} onChange={field.onChange} label={label} description={description} />}
    />
  );
}

/** All settings form sections; `form` is the useForm() return value. */
export function SettingsSections({ form }) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const [announcement, codEnabled] = useWatch({ control, name: ['announcement', 'codEnabled'] });
  const codOff = !codEnabled;
  const codProps = codOff
    ? { readOnly: true, 'aria-disabled': true, inputClassName: 'bg-surface text-ink-400', hint: 'Enable cash on delivery to edit' }
    : {};

  return (
    <div className="space-y-6">
      <FormSection id="settings-store" title="Store profile" description="Shown in the footer, emails and invoices.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <Input label="Store name" required error={errors.storeName?.message} {...register('storeName')} />
          <Input label="Support email" type="email" required autoComplete="off" error={errors.supportEmail?.message} {...register('supportEmail')} />
          <Input label="Support phone" type="tel" required error={errors.supportPhone?.message} {...register('supportPhone')} />
        </div>
        <Textarea label="Address" rows={3} error={errors.address?.message} {...register('address')} />
      </FormSection>

      <FormSection id="settings-storefront" title="Storefront" description="The announcement bar at the top of every page.">
        <div>
          <Input label="Announcement" hint="Leave empty to hide the bar." error={errors.announcement?.message} {...register('announcement')} />
          <div className="mt-1 flex justify-end">
            <CharCount value={announcement} max={160} />
          </div>
        </div>
      </FormSection>

      <FormSection id="settings-shipping" title="Shipping">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <NumberInput register={register} errors={errors} name="freeShippingThreshold" label="Free shipping above" leftIcon={rupee} hint="Orders at or above this subtotal ship free." />
          <NumberInput register={register} errors={errors} name="shippingFee" label="Standard shipping fee" leftIcon={rupee} />
        </div>
      </FormSection>

      <FormSection id="settings-payments" title="Payments">
        <SwitchField control={control} name="codEnabled" label="Cash on delivery" description="Let shoppers pay when the order arrives." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <NumberInput register={register} errors={errors} name="codFee" label="COD fee" leftIcon={rupee} {...codProps} />
          <NumberInput
            register={register}
            errors={errors}
            name="codMaxOrderAmount"
            label="Maximum COD order value"
            leftIcon={rupee}
            hint={codOff ? codProps.hint : 'Orders above this amount must be paid online.'}
            {...codProps}
          />
        </div>
      </FormSection>

      <FormSection id="settings-orders" title="Orders">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <NumberInput register={register} errors={errors} name="returnWindowDays" label="Return window (days)" max="60" step="1" inputMode="numeric" hint="0–60 days after delivery. 0 disables returns." />
          <NumberInput
            register={register}
            errors={errors}
            name="reservationTtlMinutes"
            label="Stock reservation (minutes)"
            min="5"
            max="1440"
            step="1"
            inputMode="numeric"
            hint="How long unpaid online orders hold stock (5–1440)."
          />
        </div>
      </FormSection>

      <FormSection id="settings-inventory" title="Inventory">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <NumberInput
            register={register}
            errors={errors}
            name="defaultLowStockThreshold"
            label="Default low-stock threshold"
            step="1"
            inputMode="numeric"
            hint="Used for new SKUs without their own threshold."
          />
        </div>
      </FormSection>

      <FormSection id="settings-reviews" title="Reviews">
        <SwitchField
          control={control}
          name="requireReviewModeration"
          label="Require moderation"
          description="New reviews stay hidden until approved in Reviews."
        />
      </FormSection>

      <FormSection id="settings-social" title="Social links" description="Leave a field empty to hide that icon.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          {SOCIAL_KEYS.map((key) => (
            <Input
              key={key}
              label={SOCIAL_LABELS[key]}
              type="url"
              inputMode="url"
              placeholder="https://"
              error={errors.social?.[key]?.message}
              {...register(`social.${key}`)}
            />
          ))}
        </div>
      </FormSection>
    </div>
  );
}
