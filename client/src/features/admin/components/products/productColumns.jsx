import { Link } from 'react-router';
import { SmartImage } from '@/components/ui';
import { formatNumber, formatPrice, pluralize } from '@/utils/format';
import { stockState } from '../../utils';
import { StatusBadge } from '../StatusBadge';
import { PublishPill, RowActions } from './ProductRowParts';

export const productColumns = ({ onDelete }) => [
  {
    key: 'product',
    header: 'Product',
    cell: (p) => (
      <div className="flex min-w-0 items-center gap-3">
        <SmartImage src={p.thumbnail} alt="" width={80} className="h-10 w-10 shrink-0 rounded-lg border border-line bg-surface" />
        <div className="max-w-44 min-w-0 sm:max-w-64">
          <Link to={`/admin/products/${p._id}/edit`} className="block truncate font-medium text-ink-900 hover:text-brand-600">
            {p.name}
          </Link>
          <p className="truncate font-mono text-xs text-ink-400">SKU: {p.sku || '—'}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'category',
    header: 'Category',
    hideBelow: 'md',
    cell: (p) => (
      <div className="max-w-40 min-w-0">
        <p className="truncate text-ink-700">{p.category?.name ?? '—'}</p>
        {p.brand?.name && <p className="truncate text-xs text-ink-400">{p.brand.name}</p>}
      </div>
    ),
  },
  {
    key: 'price',
    header: 'Price',
    align: 'right',
    cell: (p) => (
      <div className="whitespace-nowrap tabular-nums">
        <p className="font-semibold text-ink-900">{formatPrice(p.price)}</p>
        {p.compareAtPrice > p.price && <p className="text-xs text-ink-400 line-through">{formatPrice(p.compareAtPrice)}</p>}
      </div>
    ),
  },
  {
    key: 'stock',
    header: 'Stock',
    cell: (p) => {
      const state = stockState(p.stock, 5);
      return (
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink-900 tabular-nums">{formatNumber(p.stock)}</span>
            {state !== 'in' && <StatusBadge type="stock" value={state} dot={false} />}
          </div>
          {p.variantCount > 0 && <span className="text-xs whitespace-nowrap text-ink-400">{pluralize(p.variantCount, 'variant')}</span>}
        </div>
      );
    },
  },
  { key: 'status', header: 'Status', cell: (p) => <PublishPill product={p} /> },
  { key: 'actions', header: 'Actions', align: 'right', cell: (p) => <RowActions product={p} onDelete={onDelete} /> },
];
