import { RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

/** Mini trust row (Free Shipping · Secure Payment · Easy Returns) driven by store settings. */
export function TrustRows({ className }) {
  const { settings } = useStoreSettings();
  const days = settings.returnWindowDays;
  const items = [
    {
      icon: Truck,
      title: 'Free Shipping',
      text: settings.freeShippingThreshold > 0 ? `On orders above ${formatPrice(settings.freeShippingThreshold)}` : 'On every order',
    },
    { icon: ShieldCheck, title: 'Secure Payment', text: settings.codEnabled ? 'Razorpay & Cash on Delivery' : '100% secure via Razorpay' },
    { icon: RotateCcw, title: days > 0 ? `${days} Days Return` : 'Easy Returns', text: 'Hassle-free pickup' },
  ];

  return (
    <ul className={cn('grid grid-cols-1 gap-3 rounded-xl border border-line bg-surface p-3 min-[400px]:grid-cols-3 min-[400px]:gap-2 sm:p-4 *:min-w-0', className)}>
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className="flex items-center gap-2.5 min-[400px]:flex-col min-[400px]:text-center sm:flex-row sm:text-left">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] leading-tight font-semibold text-ink-900">{title}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-ink-500">{text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default TrustRows;
