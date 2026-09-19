import { Input } from '@/components/ui';

/**
 * Carrier / tracking number / URL / ETA inputs for a react-hook-form form.
 * `prefix` is the field path prefix (e.g. "tracking." inside the status form).
 */
export function TrackingFields({ register, errors = {}, prefix = '', required = false, compact = false }) {
  return (
    <div className={compact ? 'grid gap-3' : 'grid gap-4 sm:grid-cols-2'}>
      <Input
        label="Carrier"
        placeholder="e.g. Delhivery"
        required={required}
        autoComplete="off"
        error={errors.carrier?.message}
        {...register(`${prefix}carrier`)}
      />
      <Input
        label="Tracking number"
        required={required}
        autoComplete="off"
        error={errors.trackingNumber?.message}
        {...register(`${prefix}trackingNumber`)}
      />
      <Input
        label="Tracking URL"
        type="url"
        placeholder="https://"
        className="sm:col-span-2"
        error={errors.trackingUrl?.message}
        {...register(`${prefix}trackingUrl`)}
      />
      <Input
        label="Estimated delivery"
        type="date"
        error={errors.estimatedDelivery?.message}
        {...register(`${prefix}estimatedDelivery`)}
      />
    </div>
  );
}
