import { useId } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartEmpty, SeriesTooltip } from './ChartParts';
import { axisProps, CHART, countTick, formatBucket, isEmptySeries, moneyTick } from './theme';

const MARGIN = { top: 8, right: 8, bottom: 0, left: 0 };

function xAxis(granularity, count) {
  return (
    <XAxis
      dataKey="date"
      {...axisProps}
      tickFormatter={(v) => formatBucket(v, granularity)}
      minTickGap={24}
      interval={count > 16 ? 'preserveStartEnd' : 0}
      dy={6}
    />
  );
}

/** Revenue over time: 2px brand line with a faint fill, crosshair tooltip. */
export function RevenueChart({ data = [], granularity = 'day', height = 280, dataKey = 'revenue', label = 'Revenue' }) {
  const gradientId = `area-${useId().replace(/:/g, '')}`;
  if (isEmptySeries(data, [dataKey])) return <ChartEmpty height={height} />;
  return (
    <div style={{ height }} role="img" aria-label={`${label} over time`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={MARGIN}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.primary} stopOpacity={0.16} />
              <stop offset="100%" stopColor={CHART.primary} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          {xAxis(granularity, data.length)}
          <YAxis {...axisProps} width={56} tickFormatter={moneyTick} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: CHART.secondary, strokeDasharray: '3 3' }}
            content={<SeriesTooltip granularity={granularity} series={[{ key: dataKey, label, color: CHART.primary, format: 'money' }, { key: 'orders', label: 'Orders', color: CHART.secondary, format: 'count' }]} />}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            name={label}
            stroke={CHART.primary}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: CHART.surface, fill: CHART.primary }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Count bars over time (orders, new customers). */
export function CountBarChart({ data = [], dataKey, label, color = CHART.primary, granularity = 'day', height = 280, extraSeries = [] }) {
  if (isEmptySeries(data, [dataKey])) return <ChartEmpty height={height} />;
  return (
    <div style={{ height }} role="img" aria-label={`${label} over time`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={MARGIN} barCategoryGap={data.length > 45 ? 1 : '22%'}>
          <CartesianGrid vertical={false} stroke={CHART.grid} />
          {xAxis(granularity, data.length)}
          <YAxis {...axisProps} width={40} tickFormatter={countTick} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: CHART.grid, opacity: 0.7 }}
            content={<SeriesTooltip granularity={granularity} series={[{ key: dataKey, label, color, format: 'count' }, ...extraSeries]} />}
          />
          <Bar dataKey={dataKey} name={label} fill={color} radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const OrdersBarChart = (props) => (
  <CountBarChart
    dataKey="orders"
    label="Orders"
    color={CHART.primary}
    extraSeries={[{ key: 'revenue', label: 'Revenue', color: CHART.secondary, format: 'money' }]}
    {...props}
  />
);

export const CustomersChart = (props) => <CountBarChart dataKey="customers" label="New customers" color={CHART.primary} {...props} />;
