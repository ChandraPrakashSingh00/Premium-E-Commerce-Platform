import { Check, ExternalLink, RotateCcw, Truck, X } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui';
import { ORDER_STATUS_LABELS, ORDER_TIMELINE } from '@/constants';
import { cn } from '@/utils/cn';
import { formatDate, formatDateTime } from '@/utils/format';

const lastAt = (history, status) => [...(history ?? [])].reverse().find((h) => h.status === status);

const isSafeUrl = (url) => /^https?:\/\//i.test(url || '');

/** Builds the list of steps shown for an order, including cancelled / returned branches. */
function buildTrackingSteps(order) {
  const history = order.statusHistory ?? [];
  const steps = [{ key: 'placed', label: 'Order placed', at: order.createdAt, state: 'done' }];
  const timelineIndex = ORDER_TIMELINE.indexOf(order.status);

  let reached = timelineIndex;
  if (timelineIndex === -1) {
    reached = Math.max(-1, ...history.map((h) => ORDER_TIMELINE.indexOf(h.status)));
  }
  const terminal = ['cancelled', 'returned', 'refunded'].includes(order.status);
  const wasCancelled = order.status === 'cancelled' || Boolean(order.cancellation?.cancelledAt);
  const visible = wasCancelled ? ORDER_TIMELINE.slice(0, reached + 1) : ORDER_TIMELINE;

  visible.forEach((status, i) => {
    const entry = lastAt(history, status);
    let state = 'upcoming';
    if (i < reached || (i === reached && (terminal || status === 'delivered'))) state = 'done';
    else if (i === reached) state = 'current';
    steps.push({ key: status, label: ORDER_STATUS_LABELS[status], at: entry?.at, note: entry?.note, state });
  });

  if (order.status === 'pending') steps[0].state = 'current';

  if (wasCancelled) {
    steps.push({
      key: 'cancelled',
      label: 'Cancelled',
      at: order.cancellation?.cancelledAt ?? lastAt(history, 'cancelled')?.at,
      note: order.cancellation?.reason,
      state: 'danger',
    });
  }
  if (['returned', 'refunded'].includes(order.status) && lastAt(history, 'returned')) {
    steps.push({ key: 'returned', label: 'Returned', at: lastAt(history, 'returned')?.at, state: 'neutral' });
  }
  if (order.status === 'refunded' || order.refund?.status === 'processed') {
    steps.push({ key: 'refunded', label: 'Refunded', at: order.refund?.processedAt ?? lastAt(history, 'refunded')?.at, state: 'neutral' });
  }
  return steps;
}

function StepIcon({ state }) {
  const base = 'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full';
  if (state === 'done') return <span className={cn(base, 'bg-brand-500 text-white')}><Check size={14} strokeWidth={3} /></span>;
  if (state === 'current')
    return (
      <span className={cn(base, 'bg-brand-500 text-white ring-4 ring-brand-100')}>
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
    );
  if (state === 'danger') return <span className={cn(base, 'bg-danger-600 text-white')}><X size={14} strokeWidth={3} /></span>;
  if (state === 'neutral') return <span className={cn(base, 'bg-ink-600 text-white')}><RotateCcw size={13} strokeWidth={2.5} /></span>;
  return <span className={cn(base, 'border-2 border-ink-200 bg-white')} />;
}

export function OrderTracking({ order }) {
  const steps = buildTrackingSteps(order);
  const { tracking = {} } = order;
  const hasTracking = tracking.carrier || tracking.trackingNumber;

  return (
    <Card>
      <CardHeader
        title="Order Tracking"
        description={
          tracking.estimatedDelivery && !['delivered', 'cancelled', 'returned', 'refunded'].includes(order.status)
            ? `Estimated delivery ${formatDate(tracking.estimatedDelivery, { weekday: 'short', day: 'numeric', month: 'short' })}`
            : undefined
        }
      />
      <ol className="relative" aria-label="Order progress">
        {steps.map((step, i) => (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0" aria-current={step.state === 'current' ? 'step' : undefined}>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn('absolute top-7 bottom-0 left-3.25 w-0.5', step.state === 'done' ? 'bg-brand-500' : 'bg-ink-200')}
              />
            )}
            <StepIcon state={step.state} />
            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  'text-sm font-semibold',
                  step.state === 'upcoming' ? 'text-ink-400' : step.state === 'danger' ? 'text-danger-600' : step.state === 'current' ? 'text-brand-600' : 'text-ink-900',
                )}
              >
                {step.label}
                <span className="sr-only">
                  {step.state === 'done' ? ' – completed' : step.state === 'current' ? ' – current step' : step.state === 'upcoming' ? ' – upcoming' : ''}
                </span>
              </p>
              {step.at && <p className="mt-0.5 text-xs text-ink-500">{formatDateTime(step.at)}</p>}
              {step.note && <p className="mt-1 text-xs leading-relaxed text-ink-600">{step.note}</p>}
            </div>
          </li>
        ))}
      </ol>

      {hasTracking && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Truck size={20} className="mt-0.5 shrink-0 text-brand-500" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-ink-900">{tracking.carrier || 'Courier'}</p>
              {tracking.trackingNumber && (
                <p className="text-ink-600">
                  Tracking no. <span className="font-mono text-ink-900 select-all">{tracking.trackingNumber}</span>
                </p>
              )}
            </div>
          </div>
          {isSafeUrl(tracking.trackingUrl) && (
            <a href={tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1.5 text-sm">
              Track shipment <ExternalLink size={14} aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </Card>
  );
}
