import { useMemo } from 'react';
import { CornerDownRight, FolderTree, ImageOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton, SmartImage } from '@/components/ui';
import { formatNumber } from '@/utils/format';
import { DataTable } from '../DataTable';
import { TogglePill } from '../TogglePill';
import { buildCategoryTree } from './categoryTree';

function Thumb({ image, name }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface text-ink-300">
      {image?.url ? <SmartImage src={image.url} alt={image.alt || name} width={72} className="h-full w-full" /> : <ImageOff size={15} aria-hidden="true" />}
    </span>
  );
}

function NameCell({ category, depth }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5" style={{ paddingLeft: depth ? `${(depth - 1) * 20 + 4}px` : undefined }}>
      {depth > 0 && <CornerDownRight size={14} className="shrink-0 text-ink-300" aria-hidden="true" />}
      <Thumb image={category.image} name={category.name} />
      <div className="min-w-0">
        <p className="max-w-[16rem] truncate font-medium text-ink-900">
          {depth > 0 && <span className="sr-only">Subcategory (level {depth + 1}): </span>}
          {category.name}
        </p>
        <p className="max-w-[16rem] truncate font-mono text-xs text-ink-400">/{category.slug}</p>
      </div>
    </div>
  );
}

/** Indented category tree table. */
export function CategoryTable({ query, searching, onEdit, onDelete, onCreate, toggle }) {
  const rows = useMemo(() => buildCategoryTree(query.data ?? [], { flat: searching }), [query.data, searching]);

  const columns = [
    { key: 'name', header: 'Category', cell: ({ category, depth }) => <NameCell category={category} depth={depth} /> },
    {
      key: 'parent',
      header: 'Parent',
      hideBelow: 'md',
      cell: ({ category }) => (category.parent?.name ? <span className="text-ink-600">{category.parent.name}</span> : <span className="text-ink-400">Top level</span>),
    },
    {
      key: 'products',
      header: 'Products',
      align: 'right',
      cell: ({ category }) => <span className="tabular-nums">{formatNumber(category.productCount ?? 0)}</span>,
    },
    {
      key: 'sortOrder',
      header: 'Sort',
      align: 'right',
      hideBelow: 'sm',
      cell: ({ category }) => <span className="text-ink-500 tabular-nums">{category.sortOrder ?? 0}</span>,
    },
    {
      key: 'published',
      header: 'Status',
      cell: ({ category }) => (
        <TogglePill
          checked={Boolean(category.isPublished)}
          offText="Hidden"
          label={`Published: ${category.name}`}
          disabled={toggle.isPending && toggle.variables?.id === category._id}
          onChange={(isPublished) => toggle.mutate({ id: category._id, isPublished })}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: ({ category }) => (
        <div className="flex justify-end gap-1">
          <IconButton size="iconSm" label={`Edit ${category.name}`} onClick={() => onEdit(category)} className="text-ink-500 hover:bg-brand-50 hover:text-brand-600">
            <Pencil size={15} />
          </IconButton>
          <IconButton size="iconSm" label={`Delete ${category.name}`} onClick={() => onDelete(category)} className="text-ink-500 hover:bg-danger-50 hover:text-danger-600">
            <Trash2 size={15} />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      caption="Categories"
      columns={columns}
      rows={rows}
      rowKey={(row) => row.category._id}
      loading={query.isPending}
      fetching={query.isFetching}
      error={query.data ? null : query.error}
      onRetry={() => query.refetch()}
      dense
      minWidth={720}
      empty={
        searching
          ? { icon: <FolderTree size={28} strokeWidth={1.5} />, title: 'No matching categories', description: 'Try a different name or slug.' }
          : {
              icon: <FolderTree size={28} strokeWidth={1.5} />,
              title: 'No categories yet',
              description: 'Create your first category to start organising products.',
              action: (
                <Button size="sm" leftIcon={<Plus size={16} />} onClick={onCreate}>
                  Add category
                </Button>
              ),
            }
      }
    />
  );
}
