import { AlertTriangle, PackageOpen, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';

export function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" {...props} />;
}

export function SkeletonText({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, description, action, className, compact = false }) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-10' : 'py-16 sm:py-24', className)}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        {icon ?? <PackageOpen size={28} strokeWidth={1.5} />}
      </div>
      <h2 className="text-lg font-semibold text-ink-900 sm:text-xl">{title}</h2>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, title, description, onRetry, className, compact = false }) {
  const offline = error?.code === 'NETWORK_ERROR' || error?.status === 0;
  const notFound = error?.status === 404;
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-10' : 'py-16 sm:py-24', className)}>
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 text-danger-600">
        {offline ? <WifiOff size={28} strokeWidth={1.5} /> : <AlertTriangle size={28} strokeWidth={1.5} />}
      </div>
      <h2 className="text-lg font-semibold text-ink-900 sm:text-xl">
        {title ?? (offline ? 'You appear to be offline' : notFound ? 'Not found' : 'Something went wrong')}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
        {description ?? (offline ? 'Check your internet connection and try again.' : error?.message || 'We could not load this content. Please try again.')}
      </p>
      {onRetry && !notFound && (
        <Button variant="secondary" className="mt-6" onClick={onRetry} leftIcon={<RefreshCw size={16} />}>
          Try again
        </Button>
      )}
    </div>
  );
}
