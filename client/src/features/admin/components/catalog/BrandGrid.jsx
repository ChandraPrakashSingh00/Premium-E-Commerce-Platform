import { Globe, Pencil, Plus, Star, Tags, Trash2 } from 'lucide-react';
import { Badge, Button, EmptyState, ErrorState, IconButton, Skeleton } from '@/components/ui';
import { cn } from '@/utils/cn';
import { pluralize } from '@/utils/format';
import { TogglePill } from '../TogglePill';
import { websiteHost } from './schemas';

function BrandLogo({ brand }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface p-2">
      {brand.logo?.url ? (
        <img src={brand.logo.url} alt={brand.logo.alt || `${brand.name} logo`} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
      ) : (
        <span className="font-display text-xl font-semibold text-ink-400" aria-hidden="true">
          {brand.name?.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function BrandCard({ brand, toggle, onEdit, onDelete }) {
  const host = websiteHost(brand.website);
  return (
    <li className="flex min-w-0 flex-col rounded-xl border border-line bg-white p-4 transition-[border-color,box-shadow] hover:border-brand-200 hover:shadow-soft">
      <div className="flex items-start gap-3">
        <BrandLogo brand={brand} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-ink-900" title={brand.name}>
              {brand.name}
            </h3>
            {brand.isFeatured && (
              <Badge tone="brand" className="shrink-0">
                <Star size={11} aria-hidden="true" /> Featured
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-ink-500 tabular-nums">{pluralize(brand.productCount ?? 0, 'product')}</p>
          {host ? (
            <a
              href={brand.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-brand-600 hover:underline"
            >
              <Globe size={12} aria-hidden="true" className="shrink-0" />
              <span className="truncate">{host}</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <p className="mt-1 text-xs text-ink-400">No website</p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
        <div className="min-w-0 flex-1">
          <TogglePill
            checked={Boolean(brand.isPublished)}
            offText="Hidden"
            label={`Published: ${brand.name}`}
            disabled={toggle.isPending && toggle.variables?.id === brand._id}
            onChange={(isPublished) => toggle.mutate({ id: brand._id, isPublished })}
          />
        </div>
        <div className="flex shrink-0 gap-1 border-l border-line pl-2">
          <IconButton size="iconSm" label={`Edit ${brand.name}`} onClick={() => onEdit(brand)} className="text-ink-500 hover:bg-brand-50 hover:text-brand-600">
            <Pencil size={15} />
          </IconButton>
          <IconButton size="iconSm" label={`Delete ${brand.name}`} onClick={() => onDelete(brand)} className="text-ink-500 hover:bg-danger-50 hover:text-danger-600">
            <Trash2 size={15} />
          </IconButton>
        </div>
      </div>
    </li>
  );
}

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 [&>*]:min-w-0';

/** Responsive brand cards with loading / empty / error states. */
export function BrandGrid({ query, searching, toggle, onEdit, onDelete, onCreate }) {
  if (query.isPending) {
    return (
      <ul className={GRID} aria-busy="true" aria-label="Loading brands">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="rounded-xl border border-line bg-white p-4">
            <div className="flex gap-3">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="mt-4 h-8 w-full" />
          </li>
        ))}
      </ul>
    );
  }

  if (query.isError && !query.data) {
    return (
      <div className="rounded-xl border border-line bg-white">
        <ErrorState error={query.error} onRetry={() => query.refetch()} compact />
      </div>
    );
  }

  const brands = query.data ?? [];
  if (!brands.length) {
    return (
      <div className="rounded-xl border border-line bg-white">
        <EmptyState
          compact
          icon={<Tags size={28} strokeWidth={1.5} />}
          title={searching ? 'No matching brands' : 'No brands yet'}
          description={searching ? 'Try a different name.' : 'Add the brands you sell so customers can filter by them.'}
          action={
            !searching && (
              <Button size="sm" leftIcon={<Plus size={16} />} onClick={onCreate}>
                Add brand
              </Button>
            )
          }
        />
      </div>
    );
  }

  return (
    <ul className={cn(GRID, 'transition-opacity', query.isFetching && 'opacity-70')} aria-label="Brands">
      {brands.map((brand) => (
        <BrandCard key={brand._id} brand={brand} toggle={toggle} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </ul>
  );
}
