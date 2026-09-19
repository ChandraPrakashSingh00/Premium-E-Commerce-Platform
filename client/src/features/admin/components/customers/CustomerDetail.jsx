import { MapPin, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '@/components/ui';
import { formatDate, formatDateTime, formatNumber, formatPrice, formatRelative, pluralize } from '@/utils/format';
import { StatusBadge } from '../StatusBadge';
import { CustomerAvatar } from './CustomerAvatar';

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-line px-3.5 py-3">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-ink-900 tabular-nums">{value}</dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="border-t border-line px-5 py-5">
      <h3 className="mb-3 text-sm font-semibold text-ink-900">{title}</h3>
      {children}
    </section>
  );
}

export function CustomerHeader({ customer }) {
  return (
    <div className="flex items-start gap-4 px-5 py-5">
      <CustomerAvatar name={customer.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-semibold text-ink-900">{customer.name}</p>
          <StatusBadge type="customer" value={customer.status} />
          {!customer.isEmailVerified && <Badge tone="neutral">Unverified</Badge>}
        </div>
        <a href={`mailto:${customer.email}`} className="mt-0.5 block truncate text-sm text-brand-600 hover:underline">
          {customer.email}
        </a>
        {customer.phone && <p className="text-sm text-ink-600 tabular-nums">{customer.phone}</p>}
        <p className="mt-2 text-xs text-ink-500">
          Joined {formatDate(customer.createdAt)} · Last login{' '}
          {customer.lastLoginAt ? <span title={formatDateTime(customer.lastLoginAt)}>{formatRelative(customer.lastLoginAt)}</span> : 'never'}
        </p>
      </div>
    </div>
  );
}

export function CustomerStats({ stats = {} }) {
  return (
    <dl className="grid grid-cols-2 gap-3 px-5 pb-5">
      <StatTile label="Orders" value={formatNumber(stats.orderCount)} />
      <StatTile label="Total spent" value={formatPrice(stats.totalSpent)} />
      <StatTile label="Avg. order value" value={formatPrice(stats.avgOrderValue)} />
      <StatTile label="Cancelled" value={formatNumber(stats.cancelledCount)} />
    </dl>
  );
}

export function RecentOrders({ orders = [] }) {
  return (
    <Section title="Recent orders">
      {orders.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <ShoppingBag size={16} aria-hidden="true" /> No orders yet.
        </p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {orders.map((o) => (
            <li key={o._id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3.5 py-3">
              <div className="min-w-0">
                <Link to={`/admin/orders/${o._id}`} className="text-sm font-semibold text-brand-600 hover:underline">
                  {o.orderNumber}
                </Link>
                <p className="text-xs text-ink-500">
                  {formatDate(o.createdAt)}
                  {o.itemCount !== undefined && ` · ${pluralize(o.itemCount, 'item')}`}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <span className="mr-1 text-sm font-semibold text-ink-900 tabular-nums">{formatPrice(o.pricing?.total)}</span>
                <StatusBadge type="order" value={o.status} />
                <StatusBadge type="payment" value={o.paymentStatus} dot={false} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

export function AddressList({ addresses = [] }) {
  return (
    <Section title="Addresses">
      {addresses.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-ink-500">
          <MapPin size={16} aria-hidden="true" /> No saved addresses.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 [&>*]:min-w-0">
          {addresses.map((a) => (
            <li key={a._id} className="rounded-xl border border-line p-3.5 text-sm">
              <div className="mb-1 flex items-center gap-1.5">
                <p className="font-medium text-ink-900">{a.fullName}</p>
                {a.label && <Badge tone="neutral" className="capitalize">{a.label}</Badge>}
                {a.isDefault && <Badge tone="brand">Default</Badge>}
              </div>
              <address className="leading-relaxed text-ink-600 not-italic">
                {a.addressLine1}
                {a.addressLine2 && `, ${a.addressLine2}`}
                {a.landmark && `, ${a.landmark}`}
                <br />
                {a.city}, {a.state} {a.postalCode}
                <br />
                {a.country}
                {a.phone && (
                  <>
                    <br />
                    <span className="tabular-nums">{a.phone}</span>
                  </>
                )}
              </address>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
