import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { useToggleProductPublish } from '../../hooks/useProducts';
import { TogglePill } from '../TogglePill';

/** Status pill that doubles as the publish toggle (green Published / grey Draft). */
export function PublishPill({ product }) {
  const toggle = useToggleProductPublish();
  const pendingValue = toggle.isPending ? toggle.variables?.isPublished : undefined;
  const checked = pendingValue ?? Boolean(product.isPublished);
  return (
    <TogglePill
      checked={checked}
      label={`Published: ${product.name}`}
      disabled={toggle.isPending}
      onChange={(next) => toggle.mutate({ id: product._id, isPublished: next })}
    />
  );
}

export function RowActions({ product, onDelete }) {
  return (
    <div className="flex items-center justify-end gap-1">
      {product.isPublished && (
        <IconButton label={`View ${product.name} in store`} size="iconSm" className="text-ink-500 hover:text-brand-600" href={`/product/${product.slug}`}>
          <ExternalLink size={15} />
        </IconButton>
      )}
      <IconButton label={`Edit ${product.name}`} size="iconSm" className="text-ink-500 hover:bg-brand-50 hover:text-brand-600" to={`/admin/products/${product._id}/edit`}>
        <Pencil size={15} />
      </IconButton>
      <IconButton label={`Delete ${product.name}`} size="iconSm" className="text-ink-500 hover:bg-danger-50 hover:text-danger-600" onClick={() => onDelete(product)}>
        <Trash2 size={15} />
      </IconButton>
    </div>
  );
}
