import { useMemo } from 'react';
import { Download } from 'lucide-react';
import { Button, ErrorState } from '@/components/ui';
import { DateRangeInputs, PageHeader } from '@/features/admin/components';
import { AnalyticsSummary, PaymentMethodsCard, SeriesCharts, TopTables } from '@/features/admin/components/analytics/AnalyticsSections';
import { exportAll } from '@/features/admin/components/analytics/analyticsExport';
import { Segmented } from '@/features/admin/components/charts';
import { useAnalytics } from '@/features/admin/hooks/useDashboard';
import { useListParams } from '@/features/admin/hooks/shared';
import { daysAgo, toDateInput } from '@/features/admin/utils';
import { formatDate } from '@/utils/format';

const GRANULARITIES = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const PRESETS = [
  { value: '7', label: '7D', days: 6 },
  { value: '30', label: '30D', days: 29 },
  { value: '90', label: '90D', days: 89 },
  { value: '365', label: '1Y', days: 364 },
];

/** Picks a sensible granularity for a span (keeps bucket counts readable and within API limits). */
const autoGranularity = (days) => (days > 180 ? 'month' : days > 62 ? 'week' : 'day');

export default function AnalyticsPage() {
  const { params, setParams } = useListParams();
  const today = toDateInput(new Date());
  const to = params.to || today;
  const from = params.from || toDateInput(daysAgo(29, new Date(`${to}T00:00:00`)));
  const granularity = GRANULARITIES.some((g) => g.value === params.granularity) ? params.granularity : 'day';

  const query = useMemo(() => ({ from, to, granularity }), [from, to, granularity]);
  const { data, isPending, isFetching, error, refetch } = useAnalytics(query);

  const spanDays = Math.round((new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86_400_000);
  const activePreset = to === today ? PRESETS.find((p) => p.days === spanDays)?.value : undefined;
  const period = { from, to, granularity };

  const applyPreset = (value) => {
    const preset = PRESETS.find((p) => p.value === value);
    setParams({ from: toDateInput(daysAgo(preset.days)), to: '', granularity: autoGranularity(preset.days) === 'day' ? '' : autoGranularity(preset.days) });
  };

  const onRange = ({ from: f, to: t }) => {
    if (!f || !t) return;
    const days = Math.round((new Date(`${t}T00:00:00`) - new Date(`${f}T00:00:00`)) / 86_400_000);
    const needed = autoGranularity(days);
    const order = ['day', 'week', 'month'];
    // Only coarsen automatically; never override a coarser manual choice.
    const next = order.indexOf(needed) > order.indexOf(granularity) ? needed : granularity;
    setParams({ from: f, to: t === today ? '' : t, granularity: next === 'day' ? '' : next });
  };

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`Sales, customers and catalogue performance · ${formatDate(from)} – ${formatDate(to)}`}
        actions={
          <Button variant="secondary" size="sm" leftIcon={<Download size={15} />} disabled={!data} onClick={() => exportAll(data, period)}>
            Export CSV
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-line bg-white p-3 lg:flex-row lg:items-center lg:justify-between" role="group" aria-label="Report filters">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Quick range" size="md" options={PRESETS} value={activePreset} onChange={applyPreset} />
          <DateRangeInputs from={from} to={to} onChange={onRange} className="w-full sm:w-auto" />
        </div>
        <div className="flex items-center gap-2">
          {isFetching && !isPending && <span className="text-xs text-ink-500">Updating…</span>}
          <Segmented label="Granularity" size="md" options={GRANULARITIES} value={granularity} onChange={(g) => setParams({ granularity: g === 'day' ? '' : g })} />
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-line bg-white">
          <ErrorState error={error} onRetry={refetch} title="Could not load analytics" />
        </div>
      ) : (
        <div className="space-y-6">
          <AnalyticsSummary summary={data?.summary} loading={isPending} />
          <SeriesCharts series={data?.series} granularity={granularity} loading={isPending} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
            <PaymentMethodsCard items={data?.paymentMethods} loading={isPending} />
            <div className="rounded-xl border border-line bg-white p-5 text-sm text-ink-600 sm:p-6 lg:col-span-2">
              <h2 className="text-base font-semibold text-ink-900">How these numbers are calculated</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                <li>Revenue counts paid or partially refunded orders (net of refunds) and delivered cash-on-delivery orders, excluding cancelled and refunded orders.</li>
                <li>Orders counts every order placed in the range, whatever its status.</li>
                <li>Dates are grouped in India time (IST); weeks start on Monday and each point shows the first day of its period.</li>
                <li>Top lists rank the 10 best sellers by revenue from paid orders.</li>
              </ul>
            </div>
          </div>
          <TopTables data={data} loading={isPending} period={period} />
        </div>
      )}
    </>
  );
}
