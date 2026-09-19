import { BrandMark } from '@/components/brand/BrandMark';
import { cn } from '@/utils/cn';

export function Spinner({ className, label = 'Loading' }) {
  return (
    <svg className={cn('h-5 w-5 animate-spin', className)} viewBox="0 0 24 24" fill="none" role="status" aria-label={label}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader({ label = 'Loading…', className }) {
  return (
    <div className={cn('flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-500', className)}>
      <Spinner className="h-7 w-7 text-brand-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <span className="flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight">
          <BrandMark size={40} />
          <span>
            <span className="text-brand-500">Blue</span>Mart
          </span>
        </span>
        <Spinner className="h-6 w-6 text-brand-500" />
      </div>
    </div>
  );
}
