import { Mail, Phone, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { formatDateTime, formatLandmark, titleCase } from '@/utils/format';
import { DetailRow } from '../FormSection';
import { SectionCard } from './SectionCard';

/** Account holder plus the contact details captured at checkout. */
export function CustomerCard({ user, contact = {} }) {
  const account = user && typeof user === 'object' ? user : null;
  const email = account?.email || contact.email;
  const differs =
    account && (contact.name !== account.name || contact.email !== account.email || (contact.phone && contact.phone !== account.phone));

  return (
    <SectionCard
      title="Customer"
      action={
        email && (
          <Link to={`/admin/customers?q=${encodeURIComponent(email)}`} className="text-sm font-medium text-brand-600 hover:underline">
            View customer
          </Link>
        )
      }
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500" aria-hidden="true">
          <UserRound size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{account?.name || contact.name || 'Unknown customer'}</p>
          {!account && <p className="text-xs text-ink-500">Account unavailable</p>}
        </div>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {email && (
          <li className="flex items-center gap-2">
            <Mail size={14} className="shrink-0 text-ink-400" aria-hidden="true" />
            <a href={`mailto:${email}`} className="truncate text-brand-600 hover:underline">
              {email}
            </a>
          </li>
        )}
        {(account?.phone || contact.phone) && (
          <li className="flex items-center gap-2">
            <Phone size={14} className="shrink-0 text-ink-400" aria-hidden="true" />
            <a href={`tel:${account?.phone || contact.phone}`} className="text-ink-700 tabular-nums hover:text-ink-900">
              {account?.phone || contact.phone}
            </a>
          </li>
        )}
      </ul>
      {differs && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-1 text-xs font-medium tracking-wide text-ink-500 uppercase">Contact at checkout</p>
          <p className="text-sm text-ink-700">{contact.name}</p>
          <p className="text-sm break-all text-ink-700">{contact.email}</p>
          <p className="text-sm text-ink-700 tabular-nums">{contact.phone}</p>
        </div>
      )}
    </SectionCard>
  );
}

export function ShippingAddressCard({ address }) {
  if (!address) return null;
  const cityLine = [address.city, address.state, address.postalCode].filter(Boolean).join(', ');
  return (
    <SectionCard title="Shipping address">
      <address className="space-y-0.5 text-sm text-ink-700 not-italic">
        <p className="font-semibold text-ink-900">
          {address.fullName}
          {address.label && <span className="ml-2 text-xs font-normal text-ink-500">({titleCase(address.label)})</span>}
        </p>
        <p>{address.addressLine1}</p>
        {address.addressLine2 && <p>{address.addressLine2}</p>}
        {address.landmark && <p className="text-ink-500">{formatLandmark(address.landmark)}</p>}
        <p>{cityLine}</p>
        {address.country && <p>{address.country}</p>}
        {address.phone && <p className="pt-1 text-ink-500 tabular-nums">{address.phone}</p>}
      </address>
    </SectionCard>
  );
}

export function CustomerNoteCard({ note }) {
  if (!note) return null;
  return (
    <SectionCard title="Customer note">
      <p className="text-sm whitespace-pre-line text-ink-700">{note}</p>
    </SectionCard>
  );
}

const CANCELLED_BY = { customer: 'Customer', admin: 'Admin', system: 'System (payment timeout)' };

export function CancellationCard({ cancellation }) {
  if (!cancellation?.cancelledAt && !cancellation?.reason) return null;
  return (
    <SectionCard title="Cancellation">
      <dl className="-my-2 divide-y divide-line">
        <DetailRow label="Reason">{cancellation.reason || '—'}</DetailRow>
        <DetailRow label="Cancelled by">{CANCELLED_BY[cancellation.cancelledBy] ?? titleCase(cancellation.cancelledBy)}</DetailRow>
        <DetailRow label="Cancelled at">{cancellation.cancelledAt ? formatDateTime(cancellation.cancelledAt) : '—'}</DetailRow>
      </dl>
    </SectionCard>
  );
}
