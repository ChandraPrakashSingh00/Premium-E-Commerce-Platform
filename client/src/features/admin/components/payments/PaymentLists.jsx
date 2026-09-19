import { Badge } from '@/components/ui';
import { formatDateTime, formatPrice, titleCase } from '@/utils/format';

const ATTEMPT_TONE = { captured: 'success', authorized: 'brand', failed: 'danger', cancelled: 'neutral' };
const REFUND_TONE = { processed: 'success', pending: 'warning', failed: 'danger' };

function ListHeading({ children, count }) {
  return (
    <h3 className="mb-2 text-xs font-medium tracking-wide text-ink-500 uppercase">
      {children}
      <span className="ml-1 text-ink-400 tabular-nums">({count})</span>
    </h3>
  );
}

/** Razorpay payment attempts, newest first. */
export function AttemptsList({ attempts = [] }) {
  const rows = [...attempts].reverse();
  return (
    <div>
      <ListHeading count={rows.length}>Attempts</ListHeading>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-500">No payment attempts recorded.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {rows.map((a, i) => (
            <li key={`${a.razorpayPaymentId ?? 'attempt'}-${a.at}-${i}`} className="px-3.5 py-2.5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge tone={ATTEMPT_TONE[a.status] ?? 'neutral'} dot>
                    {titleCase(a.status || 'unknown')}
                  </Badge>
                  {a.method && <span className="text-ink-500">{titleCase(a.method)}</span>}
                  {a.source && <span className="text-xs text-ink-400">via {a.source}</span>}
                </div>
                <time dateTime={a.at} className="text-xs text-ink-500 tabular-nums">
                  {formatDateTime(a.at)}
                </time>
              </div>
              {a.razorpayPaymentId && <p className="mt-1 truncate font-mono text-xs text-ink-500">{a.razorpayPaymentId}</p>}
              {(a.errorDescription || a.errorCode) && (
                <p className="mt-1 text-xs text-danger-600">
                  {a.errorDescription}
                  {a.errorCode && <span className="ml-1 font-mono text-ink-500">({a.errorCode})</span>}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Refunds issued against a payment. */
export function RefundsList({ refunds = [] }) {
  const rows = [...refunds].reverse();
  return (
    <div>
      <ListHeading count={rows.length}>Refunds</ListHeading>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-500">No refunds issued.</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {rows.map((r, i) => (
            <li key={`${r.razorpayRefundId ?? 'refund'}-${r.at}-${i}`} className="px-3.5 py-2.5 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink-900 tabular-nums">{formatPrice(r.amount)}</span>
                  <Badge tone={REFUND_TONE[r.status] ?? 'neutral'} dot>
                    {titleCase(r.status || 'pending')}
                  </Badge>
                </div>
                <time dateTime={r.at} className="text-xs text-ink-500 tabular-nums">
                  {formatDateTime(r.at)}
                </time>
              </div>
              {r.reason && <p className="mt-1 text-xs text-ink-600">{r.reason}</p>}
              {r.razorpayRefundId && <p className="mt-1 truncate font-mono text-xs text-ink-500">{r.razorpayRefundId}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Monospace id with an em-dash fallback. */
export function MonoId({ value, className = '' }) {
  if (!value) return <span className="text-ink-400">—</span>;
  return (
    <span className={`font-mono text-xs break-all ${className}`} title={value}>
      {value}
    </span>
  );
}
