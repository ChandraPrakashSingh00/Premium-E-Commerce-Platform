import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { FilterBar, PageHeader } from '@/features/admin/components';
import { BrandFormModal } from '@/features/admin/components/catalog/BrandFormModal';
import { BrandGrid } from '@/features/admin/components/catalog/BrandGrid';
import { CatalogDeleteModal } from '@/features/admin/components/catalog/CatalogDeleteModal';
import { useCatalogDelete } from '@/features/admin/components/catalog/useCatalogDelete';
import { useAdminBrands, useDeleteBrand, useToggleBrandPublish } from '@/features/admin/hooks/useCatalog';
import { useListParams } from '@/features/admin/hooks/shared';
import { pluralize } from '@/utils/format';

export default function BrandsPage() {
  const { params, setParam, reset, activeCount } = useListParams();
  const q = params.q ?? '';
  const query = useAdminBrands(q ? { q } : {});
  const toggle = useToggleBrandPublish();
  const remove = useDeleteBrand();
  const del = useCatalogDelete({ remove, toggle, errorTitle: 'Could not delete brand' });

  const [form, setForm] = useState({ open: false, brand: null, key: 0 });
  const openForm = (brand = null) => setForm((f) => ({ open: true, brand, key: f.key + 1 }));
  const closeForm = () => setForm((f) => ({ ...f, open: false }));

  const onSearch = useCallback((value) => setParam('q', value), [setParam]);
  const count = query.data?.length;

  return (
    <>
      <PageHeader
        title="Brands"
        description={count !== undefined && !q ? `${pluralize(count, 'brand')} · manage the labels you carry.` : 'Manage the labels you carry.'}
        actions={
          <Button leftIcon={<Plus size={16} />} onClick={() => openForm()}>
            Add brand
          </Button>
        }
      />

      <FilterBar
        search={{ value: q, onChange: onSearch, placeholder: 'Search brands…', label: 'Search brands' }}
        onReset={() => reset()}
        activeCount={activeCount}
      />

      <BrandGrid query={query} searching={Boolean(q)} toggle={toggle} onCreate={() => openForm()} onEdit={openForm} onDelete={del.ask} />

      <BrandFormModal key={form.key} open={form.open} onClose={closeForm} brand={form.brand} />

      <CatalogDeleteModal
        {...del.modalProps}
        entity="brand"
        conflictHint="Brands that are still assigned to products can’t be deleted. Reassign those products first, or hide the brand."
      />
    </>
  );
}
