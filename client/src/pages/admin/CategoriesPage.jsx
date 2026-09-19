import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { FilterBar, PageHeader } from '@/features/admin/components';
import { CatalogDeleteModal } from '@/features/admin/components/catalog/CatalogDeleteModal';
import { CategoryFormModal } from '@/features/admin/components/catalog/CategoryFormModal';
import { CategoryTable } from '@/features/admin/components/catalog/CategoryTable';
import { useCatalogDelete } from '@/features/admin/components/catalog/useCatalogDelete';
import { useAdminCategories, useDeleteCategory, useToggleCategoryPublish } from '@/features/admin/hooks/useCatalog';
import { useListParams } from '@/features/admin/hooks/shared';
import { pluralize } from '@/utils/format';

export default function CategoriesPage() {
  const { params, setParam, reset, activeCount } = useListParams();
  const q = params.q ?? '';
  const query = useAdminCategories(q ? { q } : {});
  // Unfiltered list for the parent picker (shares the cache with the page when not searching).
  const all = useAdminCategories({});
  const toggle = useToggleCategoryPublish();
  const remove = useDeleteCategory();
  const del = useCatalogDelete({ remove, toggle, errorTitle: 'Could not delete category' });

  const [form, setForm] = useState({ open: false, category: null, key: 0 });
  const openForm = (category = null) => setForm((f) => ({ open: true, category, key: f.key + 1 }));
  const closeForm = () => setForm((f) => ({ ...f, open: false }));

  const onSearch = useCallback((value) => setParam('q', value), [setParam]);
  const count = query.data?.length;

  return (
    <>
      <PageHeader
        title="Categories"
        description={
          count !== undefined && !q ? `${pluralize(count, 'category', 'categories')} · organise how products are browsed.` : 'Organise how products are browsed in the storefront.'
        }
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => openForm()}>
            Add category
          </Button>
        }
      />

      <FilterBar
        search={{ value: q, onChange: onSearch, placeholder: 'Search categories…', label: 'Search categories' }}
        onReset={() => reset()}
        activeCount={activeCount}
      />

      <CategoryTable query={query} searching={Boolean(q)} toggle={toggle} onCreate={() => openForm()} onEdit={openForm} onDelete={del.ask} />

      <CategoryFormModal key={form.key} open={form.open} onClose={closeForm} category={form.category} categories={all.data ?? []} />

      <CatalogDeleteModal
        {...del.modalProps}
        entity="category"
        conflictHint="Categories that still contain products or subcategories can’t be deleted. Move those items first, or hide the category."
      />
    </>
  );
}
