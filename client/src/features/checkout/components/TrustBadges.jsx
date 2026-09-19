import { BadgeCheck, Lock, RotateCcw } from 'lucide-react';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { cn } from '@/utils/cn';

export function TrustBadges({ className, compact = false }) {
  const { settings } = useStoreSettings();
  const items = [
    { icon: Lock, title: 'Secure Payment', text: 'Encrypted checkout via Razorpay' },
    { icon: RotateCcw, title: `${settings.returnWindowDays ?? 7} Days Return`, text: 'Hassle-free pickups' },
    { icon: BadgeCheck, title: '100% Authentic', text: 'Sourced from the brands' },
  ];
  return (
    <ul className={cn('grid gap-3 rounded-2xl border border-line bg-white p-4', compact ? 'grid-cols-3 gap-2' : 'grid-cols-1 sm:grid-cols-3', className)}>
      {items.map(({ icon: Icon, title, text }) => (
        <li key={title} className={cn('flex min-w-0 items-center gap-2.5', compact && 'flex-col gap-1.5 text-center')}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-900">{title}</p>
            {!compact && <p className="text-xs text-ink-500">{text}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
