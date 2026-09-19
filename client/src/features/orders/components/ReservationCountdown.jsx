import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/utils/cn';

function useRemaining(target) {
  const end = target ? new Date(target).getTime() : null;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!end) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [end]);
  return end ? Math.max(0, end - now) : null;
}

const pad = (n) => String(n).padStart(2, '0');

/** "Items held for 12:34" – counts down to `expiresAt` (server `reservationExpiresAt`). */
export function ReservationCountdown({ expiresAt, className, onExpire, tone = 'default' }) {
  const light = tone === 'light';
  const remaining = useRemaining(expiresAt);
  const expired = remaining === 0;

  const onExpireRef = useRef(onExpire);
  const firedRef = useRef(false);
  useEffect(() => {
    onExpireRef.current = onExpire;
  });
  useEffect(() => {
    if (expired && !firedRef.current) {
      firedRef.current = true;
      onExpireRef.current?.();
    }
  }, [expired]);

  if (remaining === null) return null;
  const totalSeconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <p className={cn('inline-flex items-center gap-2 text-sm', expired ? (light ? 'text-white' : 'text-danger-600') : light ? 'text-white/80' : 'text-ink-700', className)}>
      <Clock size={16} aria-hidden="true" />
      {expired ? (
        <span>The reservation has expired and the items were released.</span>
      ) : (
        <span>
          Items reserved for{' '}
          <span className={cn('font-semibold tabular-nums', light ? 'text-white' : 'text-ink-900')} role="timer" aria-live="off">
            {pad(minutes)}:{pad(seconds)}
          </span>
        </span>
      )}
    </p>
  );
}
