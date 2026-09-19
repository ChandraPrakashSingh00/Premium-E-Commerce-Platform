import { Link } from 'react-router';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { SmartImage } from '@/components/ui';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/constants';
import { formatNumber, formatPrice } from '@/utils/format';
import { ChartEmpty } from './ChartParts';
import { CHART, STATUS_GROUPS } from './theme';

function StatusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const g = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-lift">
      <p className="flex items-center gap-2 font-medium text-ink-900">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} aria-hidden="true" />
        {g.label}
      </p>
      <p className="text-ink-600 tabular-nums">
        {formatNumber(g.count)} orders · {g.share.toFixed(1)}%
      </p>
      {g.parts.length > 1 && (
        <ul className="mt-1 space-y-0.5 text-xs text-ink-500">
          {g.parts.map((p) => (
            <li key={p.status} className="tabular-nums">
              {ORDER_STATUS_LABELS[p.status] ?? p.status}: {formatNumber(p.count)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Order status donut with a legend listing count and share per group.
 * items: [{ status, count }]
 */
export function OrderStatusDonut({ items = [], linkTo, size = 184 }) {
  const total = items.reduce((sum, i) => sum + i.count, 0);
  if (!total) return <ChartEmpty height={260} title="No orders in this period" description="The status mix appears once orders are placed." />;
  const known = new Set(STATUS_GROUPS.flatMap((g) => g.statuses));
  const groups = STATUS_GROUPS.map((g) => {
    const parts = items.filter((i) => g.statuses.includes(i.status) || (g.key === 'returned' && !known.has(i.status)));
    const count = parts.reduce((sum, i) => sum + i.count, 0);
    return { ...g, parts, count, share: (count / total) * 100 };
  }).filter((g) => !g.optional || g.count > 0);
  const slices = groups.filter((g) => g.count > 0);
  const rowClass = 'flex items-center justify-between gap-3 px-1 py-2 text-sm';

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative shrink-0" style={{ height: size, width: size }}>
        <div className="h-full w-full" role="img" aria-label={`Order status: ${slices.map((g) => `${g.label} ${g.share.toFixed(0)}%`).join(', ')}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="count"
                nameKey="label"
                innerRadius="68%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                stroke={CHART.surface}
                strokeWidth={slices.length > 1 ? 2 : 0}
                isAnimationActive={false}
              >
                {slices.map((g) => (
                  <Cell key={g.key} fill={g.color} />
                ))}
              </Pie>
              <Tooltip content={<StatusTooltip />} wrapperStyle={{ zIndex: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className="font-display text-2xl leading-none font-bold text-ink-900 tabular-nums">{formatNumber(total)}</span>
          <span className="mt-1 text-xs text-ink-500">Orders</span>
        </div>
      </div>
      <ul className="w-full divide-y divide-line">
        {groups.map((g) => {
          const row = (
            <>
              <span className="flex min-w-0 items-center gap-2.5 text-ink-700">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: g.color }} aria-hidden="true" />
                <span className="truncate">{g.label}</span>
              </span>
              <span className="shrink-0 text-ink-500 tabular-nums">
                {formatNumber(g.count)}
                <span className="ml-3 inline-block w-10 text-right font-semibold text-ink-900">{g.share.toFixed(0)}%</span>
              </span>
            </>
          );
          return (
            <li key={g.key}>
              {linkTo ? (
                <Link to={linkTo(g.statuses[0])} className={`${rowClass} rounded-md hover:bg-surface`}>
                  {row}
                </Link>
              ) : (
                <div className={rowClass}>{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-lift">
      <p className="font-medium text-ink-900">{p.label}</p>
      <p className="text-ink-600 tabular-nums">
        {formatNumber(p.count)} orders · {formatPrice(p.revenue)}
      </p>
    </div>
  );
}

/** Payment-method split. items: [{ method, count, revenue }] */
export function PaymentMethodDonut({ items = [], height = 200 }) {
  const total = items.reduce((s, i) => s + i.count, 0);
  if (!total) return <ChartEmpty height={height} title="No payments in this period" description="" />;
  const data = items.map((i, idx) => ({ ...i, label: PAYMENT_METHOD_LABELS[i.method] ?? i.method, color: CHART.categorical[idx % CHART.categorical.length] }));
  return (
    <div className="flex flex-col items-center gap-5">
      <div style={{ height, width: height }} className="shrink-0" role="img" aria-label="Orders by payment method">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius="68%" outerRadius="100%" paddingAngle={data.length > 1 ? 2 : 0} stroke={CHART.surface} strokeWidth={2} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.method} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full divide-y divide-line">
        {data.map((d) => (
          <li key={d.method} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="flex items-center gap-2 text-ink-700">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden="true" />
              {d.label}
            </span>
            <span className="text-right tabular-nums">
              <span className="block font-semibold text-ink-900">{((d.count / total) * 100).toFixed(0)}%</span>
              <span className="block text-xs text-ink-500">
                {formatNumber(d.count)} · {formatPrice(d.revenue)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Ranked list with a relative revenue bar.
 * items: [{ id, name, thumbnail?, quantity, revenue, to? }]
 */
export function TopList({ items = [], emptyTitle = 'Nothing sold yet', showImage = false }) {
  if (!items.length) return <ChartEmpty height={200} title={emptyTitle} description="Rankings appear once orders are paid." />;
  const max = Math.max(...items.map((i) => i.revenue), 1);
  return (
    <ol className="space-y-3.5">
      {items.map((item, i) => {
        const name = item.to ? (
          <Link to={item.to} className="truncate font-medium text-ink-900 hover:text-brand-600">
            {item.name}
          </Link>
        ) : (
          <span className="truncate font-medium text-ink-900">{item.name}</span>
        );
        return (
          <li key={item.id ?? item.name} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-xs font-medium text-ink-400 tabular-nums">{i + 1}</span>
            {showImage && <SmartImage src={item.thumbnail} alt="" width={80} className="h-9 w-9 shrink-0 rounded-lg" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                {name}
                <span className="shrink-0 font-semibold text-ink-900 tabular-nums">{formatPrice(item.revenue)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-ink-100" aria-hidden="true">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, (item.revenue / max) * 100)}%` }} />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-ink-500 tabular-nums">{formatNumber(item.quantity)} sold</span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
