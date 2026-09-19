import { Gem, Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

const ITEMS = [
  { icon: Gem, title: 'Premium Quality', text: 'Handpicked & verified' },
  { icon: ShieldCheck, title: 'Secure Payments', text: '100% protected checkout' },
  { icon: Truck, title: 'Fast Delivery', text: 'Dispatched within 24 hrs' },
  { icon: RotateCcw, title: 'Easy Returns', text: 'Hassle-free, within 7 days' },
  { icon: Headphones, title: '24/7 Support', text: 'Always here to help' },
];

/** Dark pre-footer band with five trust promises. */
export function TrustBand() {
  return (
    <div className="bg-ink-900 text-white">
      <ul className="container-page grid grid-cols-2 gap-x-4 gap-y-6 py-8 sm:grid-cols-3 lg:grid-cols-5 lg:py-9 [&>*]:min-w-0">
        {ITEMS.map(({ icon: Icon, title, text }, i) => (
          <li key={title} className={i === ITEMS.length - 1 ? 'col-span-2 sm:col-span-1' : undefined}>
            <div className="flex items-center gap-3 max-sm:flex-col max-sm:text-center lg:justify-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 text-white" aria-hidden="true">
                <Icon size={22} strokeWidth={1.6} />
              </span>
              <p className="min-w-0 leading-tight">
                <span className="block text-sm font-semibold text-white">{title}</span>
                <span className="mt-0.5 block text-xs text-white/55">{text}</span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TrustBand;
