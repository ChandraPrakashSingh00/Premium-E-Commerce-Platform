import { Badge } from '@/components/ui';
import { AddressLabel, AddressLines } from '@/features/account/components/AddressCard';
import { cn } from '@/utils/cn';

const ACTION = 'inline-flex min-h-9 items-center rounded-md px-1 text-sm font-semibold underline-offset-4 hover:underline disabled:opacity-40';

/** Selectable saved-address radio card with Edit / Remove actions. */
export function AddressOption({ address, checked, onSelect, onEdit, onRemove, disabled }) {
  return (
    <div
      className={cn(
        'relative flex h-full flex-col rounded-xl border-2 bg-white transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500',
        checked ? 'border-brand-500 bg-brand-50/40' : 'border-line hover:border-brand-200',
      )}
    >
      <label className="flex flex-1 cursor-pointer gap-3 p-4 pb-2">
        <input
          type="radio"
          name="checkout-address"
          value={address._id}
          checked={checked}
          onChange={() => onSelect(address._id)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-brand-500 focus:outline-none"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <AddressLabel label={address.label} />
            {address.isDefault && <Badge tone="neutral">Default</Badge>}
          </div>
          <AddressLines address={address} />
        </div>
      </label>
      <div className="flex items-center gap-3 px-4 pb-3 pl-12">
        <button type="button" className={cn(ACTION, 'text-brand-600')} onClick={() => onEdit(address)} disabled={disabled} aria-label={`Edit address for ${address.fullName}`}>
          Edit
        </button>
        <span className="h-4 w-px bg-line" aria-hidden="true" />
        <button type="button" className={cn(ACTION, 'text-danger-600')} onClick={() => onRemove(address)} disabled={disabled} aria-label={`Remove address for ${address.fullName}`}>
          Remove
        </button>
      </div>
    </div>
  );
}

export default AddressOption;
