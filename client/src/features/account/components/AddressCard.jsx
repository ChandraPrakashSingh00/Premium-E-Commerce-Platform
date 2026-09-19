import { Briefcase, Home, MapPin } from 'lucide-react';
import { Badge, Skeleton } from '@/components/ui';
import { cn } from '@/utils/cn';
import { formatLandmark } from '@/utils/format';

const ACTION = 'inline-flex min-h-9 items-center rounded-md text-sm font-semibold underline-offset-4 hover:underline disabled:opacity-50';

const LABEL_ICONS = { home: Home, work: Briefcase, other: MapPin };

/** Plain-text address block (also used for order shipping addresses). */
export function AddressLines({ address, className }) {
  if (!address) return null;
  return (
    <address className={cn('text-sm leading-relaxed text-ink-600 not-italic', className)}>
      <span className="block font-semibold text-ink-900">{address.fullName}</span>
      <span className="block">
        {[address.addressLine1, address.addressLine2].filter(Boolean).join(', ')}
      </span>
      {address.landmark && <span className="block">{formatLandmark(address.landmark)}</span>}
      <span className="block">
        {address.city}, {address.state} {address.postalCode}
      </span>
      {address.country && address.country !== 'India' && <span className="block">{address.country}</span>}
      {address.phone && <span className="mt-1 block text-ink-500">Phone: {address.phone}</span>}
    </address>
  );
}

export function AddressLabel({ label = 'home' }) {
  const Icon = LABEL_ICONS[label] ?? MapPin;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs leading-5 font-semibold text-brand-600 capitalize">
      <Icon size={13} aria-hidden="true" />
      {label}
    </span>
  );
}

export function AddressCard({ address, onEdit, onDelete, onSetDefault, settingDefault = false }) {
  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-2xl border bg-white p-5 transition-colors',
        address.isDefault ? 'border-brand-500 ring-1 ring-brand-500' : 'border-line hover:border-brand-300',
      )}
      aria-label={`${address.label ?? 'Address'} address for ${address.fullName}`}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <AddressLabel label={address.label} />
        {address.isDefault && <Badge tone="solid">Default</Badge>}
      </div>
      <AddressLines address={address} className="mb-5" />
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4">
        <button type="button" className={cn(ACTION, 'text-brand-600')} onClick={() => onEdit(address)}>
          Edit
        </button>
        <button type="button" className={cn(ACTION, 'text-danger-600')} onClick={() => onDelete(address)}>
          Remove
        </button>
        {!address.isDefault && (
          <button type="button" className={cn(ACTION, 'ml-auto text-ink-600 hover:text-brand-600')} disabled={settingDefault} onClick={() => onSetDefault(address)}>
            {settingDefault ? 'Saving…' : 'Set as default'}
          </button>
        )}
      </div>
    </article>
  );
}

export function AddressCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5" aria-hidden="true">
      <Skeleton className="mb-4 h-3 w-16" />
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="mb-6 h-3 w-2/3" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}
