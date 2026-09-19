import { PAYMENT_METHOD_LABELS } from '@/constants';
import { downloadFile, toCsv } from '../../utils';

const money = (v) => (Number(v) || 0).toFixed(2);

export const TOP_TABLES = [
  { key: 'topProducts', title: 'Top products', idKey: 'productId', nameHeader: 'Product' },
  { key: 'topCategories', title: 'Top categories', idKey: 'categoryId', nameHeader: 'Category' },
  { key: 'topBrands', title: 'Top brands', idKey: 'brandId', nameHeader: 'Brand' },
];

const topColumns = (nameHeader) => [
  { header: 'Rank', value: (r) => r.rank },
  { header: nameHeader, value: (r) => r.name },
  { header: 'Units sold', value: (r) => r.quantity },
  { header: 'Revenue (INR)', value: (r) => money(r.revenue) },
];

const withRank = (rows = []) => rows.map((r, i) => ({ ...r, rank: i + 1 }));

const suffix = (period) => `${period.from}_to_${period.to}`;

export function exportTopTable(table, rows, period) {
  downloadFile(`${table.key}_${suffix(period)}.csv`, toCsv(withRank(rows), topColumns(table.nameHeader)));
}

/** One CSV with every table on the page, separated by blank lines. */
export function exportAll(data, period) {
  const sections = [
    `Summary (${period.from} to ${period.to}, ${period.granularity})`,
    toCsv(
      [data.summary ?? {}],
      [
        { header: 'Revenue (INR)', value: (s) => money(s.revenue) },
        { header: 'Orders', value: (s) => s.orders ?? 0 },
        { header: 'Avg order value (INR)', value: (s) => money(s.avgOrderValue) },
        { header: 'New customers', value: (s) => s.newCustomers ?? 0 },
        { header: 'Refunded (INR)', value: (s) => money(s.refunded) },
        { header: 'Items sold', value: (s) => s.itemsSold ?? 0 },
      ],
    ),
    'Series',
    toCsv(data.series ?? [], [
      { header: 'Period start', value: (r) => r.date },
      { header: 'Revenue (INR)', value: (r) => money(r.revenue) },
      { header: 'Orders', value: (r) => r.orders },
      { header: 'New customers', value: (r) => r.customers },
    ]),
    'Payment methods',
    toCsv(data.paymentMethods ?? [], [
      { header: 'Method', value: (r) => PAYMENT_METHOD_LABELS[r.method] ?? r.method },
      { header: 'Orders', value: (r) => r.count },
      { header: 'Revenue (INR)', value: (r) => money(r.revenue) },
    ]),
    ...TOP_TABLES.flatMap((t) => [t.title, toCsv(withRank(data[t.key]), topColumns(t.nameHeader))]),
  ];
  downloadFile(`analytics_${suffix(period)}.csv`, sections.join('\r\n\r\n'));
}
