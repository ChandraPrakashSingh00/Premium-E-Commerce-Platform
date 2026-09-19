import { useState } from 'react';
import { Headphones, RotateCcw, ShieldCheck, Truck, X } from 'lucide-react';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { formatPrice } from '@/utils/format';

const KEY = 'bluemart-announcement-dismissed';

const readDismissed = () => {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

/** Desktop: four trust items in a row. */
function TrustBar() {
  const { settings } = useStoreSettings();
  const items = [
    { icon: Truck, title: 'Free Shipping', text: `On Orders Above ${formatPrice(settings.freeShippingThreshold ?? 999)}` },
    { icon: ShieldCheck, title: 'Secure Payments', text: '100% Secure' },
    { icon: RotateCcw, title: 'Easy Returns', text: `Within ${settings.returnWindowDays ?? 7} Days` },
    { icon: Headphones, title: '24/7 Support', text: 'We’re Here to Help' },
  ];
  return (
    <div className="hidden border-b border-line bg-white lg:block" role="region" aria-label="Why shop with BlueMart">
      <ul className="container-page grid h-14 grid-cols-4 items-center divide-x divide-line">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center justify-center gap-3 px-4">
            <Icon size={24} strokeWidth={1.6} className="shrink-0 text-brand-500" aria-hidden="true" />
            <p className="min-w-0 leading-tight">
              <span className="block text-[13px] font-semibold text-ink-900">{title}</span>
              <span className="block truncate text-xs text-ink-500">{text}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mobile: single-line store announcement (dismissible for the session). */
function MobileAnnouncement() {
  const { settings } = useStoreSettings();
  const message = settings.announcement?.trim();
  const [dismissed, setDismissed] = useState(readDismissed);

  if (!message || dismissed === message) return null;

  const dismiss = () => {
    setDismissed(message);
    try {
      window.sessionStorage.setItem(KEY, message);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative bg-brand-500 text-white lg:hidden" role="region" aria-label="Announcement">
      <div className="container-page flex min-h-9 items-center justify-center gap-2 py-1.5 pr-10 pl-10 text-center text-xs font-medium">
        <Truck size={14} className="hidden shrink-0 min-[360px]:block" aria-hidden="true" />
        <p className="min-w-0">{message}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/75 transition-colors hover:text-white"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/** Top-of-page strip: trust bar on desktop, compact announcement on mobile. */
export default function AnnouncementBar() {
  return (
    <>
      <MobileAnnouncement />
      <TrustBar />
    </>
  );
}
