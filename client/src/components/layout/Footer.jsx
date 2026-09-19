import { Link } from 'react-router';
import { Mail, MapPin, Phone } from 'lucide-react';
import { useCategories } from '@/features/categories/hooks';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { Logo } from './Logo';
import { PaymentChips } from './PaymentChips';
import { SocialIcons } from './SocialIcons';
import { TrustBand } from './TrustBand';

const COLUMNS = [
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About Us' },
      { to: '/contact', label: 'Contact Us' },
      { to: '/faq', label: 'FAQs' },
    ],
  },
  {
    title: 'Support',
    links: [
      { to: '/account', label: 'My Account' },
      { to: '/account/orders', label: 'Track Order' },
      { to: '/shipping-policy', label: 'Shipping Info' },
      { to: '/refund-policy', label: 'Returns & Refunds' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { to: '/privacy-policy', label: 'Privacy Policy' },
      { to: '/terms', label: 'Terms & Conditions' },
      { to: '/refund-policy', label: 'Refund Policy' },
      { to: '/shipping-policy', label: 'Shipping Policy' },
    ],
  },
];

function LinkColumn({ title, links }) {
  return (
    <div className="min-w-0">
      <h2 className="font-display text-sm font-semibold text-ink-900">{title}</h2>
      <ul className="mt-3 space-y-0.5">
        {links.map((l) => (
          <li key={`${l.to}-${l.label}`}>
            <Link to={l.to} className="inline-flex min-h-9 items-center text-sm text-ink-500 transition-colors hover:text-brand-600">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { settings } = useStoreSettings();
  const { data: categories = [] } = useCategories();
  const shopLinks = [{ to: '/shop', label: 'All Products' }, ...categories.slice(0, 5).map((c) => ({ to: `/category/${c.slug}`, label: c.name }))];
  const year = new Date().getFullYear();
  const storeName = settings.storeName || 'BlueMart';

  return (
    <footer className="pb-16 lg:pb-0" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <TrustBand />

      <div className="border-t border-line bg-white">
        <div className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-10 sm:py-12 md:grid-cols-4 lg:grid-cols-[1.6fr_repeat(4,minmax(0,1fr))] lg:gap-10 [&>*]:min-w-0">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Logo tagline />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              Premium products, better prices and faster delivery — everything you love, from brands you trust.
            </p>
            <ul className="mt-4 space-y-0.5 text-sm text-ink-600">
              {settings.supportEmail && (
                <li>
                  <a href={`mailto:${settings.supportEmail}`} className="inline-flex min-h-9 items-center gap-2.5 hover:text-brand-600">
                    <Mail size={16} className="shrink-0 text-brand-500" aria-hidden="true" /> {settings.supportEmail}
                  </a>
                </li>
              )}
              {settings.supportPhone && (
                <li>
                  <a href={`tel:${settings.supportPhone.replace(/\s/g, '')}`} className="inline-flex min-h-9 items-center gap-2.5 hover:text-brand-600">
                    <Phone size={16} className="shrink-0 text-brand-500" aria-hidden="true" /> {settings.supportPhone}
                  </a>
                </li>
              )}
              {settings.address && (
                <li className="flex items-start gap-2.5 py-2">
                  <MapPin size={16} className="mt-0.5 shrink-0 text-brand-500" aria-hidden="true" />
                  <span>{settings.address}</span>
                </li>
              )}
            </ul>
            <SocialIcons social={settings.social} tone="light" className="mt-4 flex gap-2" />
          </div>
          <LinkColumn title="Shop" links={shopLinks} />
          {COLUMNS.map((col) => (
            <LinkColumn key={col.title} {...col} />
          ))}
        </div>

        <div className="container-page">
          <div className="flex flex-col gap-3 border-t border-line py-5 sm:flex-row sm:items-center">
            <p className="shrink-0 text-sm font-semibold text-ink-900">We Accept</p>
            <PaymentChips />
          </div>
        </div>

        <div className="border-t border-line bg-surface">
          <div className="container-page flex flex-col gap-3 py-5 text-sm text-ink-500 md:flex-row md:items-center md:justify-between">
            <p>
              © {year} {storeName}. All rights reserved.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {[
                { to: '/privacy-policy', label: 'Privacy' },
                { to: '/terms', label: 'Terms' },
                { to: '/faq', label: 'Help' },
                { to: '/contact', label: 'Contact' },
              ].map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="inline-flex min-h-9 items-center hover:text-brand-600">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
