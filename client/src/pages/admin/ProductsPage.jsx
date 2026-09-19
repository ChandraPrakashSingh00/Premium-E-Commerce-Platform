import { useCallback, useMemo, useState } from 'react';
import { Package, Plus, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui';
import { DataTable, FilterBar, PageHeader } from '@/features/admin/components';
import { DeleteProductModal } from '@/features/admin/components/product-form/DeleteProductModal';
import { productColumns } from '@/features/admin/components/products/productColumns';
import { useAdminBrands, useAdminCategories } from '@/features/admin/hooks/useCatalog';
import { useAdminProducts } from '@/features/admin/hooks/useProducts';
import { useListParams } from '@/features/admin/hooks/shared';
import { categoryTreeOptions } from '@/features/admin/productSchema';

const LIMIT = 20;
const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];
const STOCK_OPTIONS = [
  { value: 'in', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];
const SORT_OPTIONS = [
  { value: 'name', label: 'Name A–Z' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
  { value: 'stock', label: 'Stock: low first' },
];

export default function ProductsPage() {
  const navigate = useNavigate();
  const { params, setParam, reset, activeCount } = useListParams({ sort: 'newest' });
  const query = useAdminProducts({ ...params, limit: LIMIT });
  const categoriesQuery = useAdminCategories();
  const brandsQuery = useAdminBrands();
  const [deleting, setDeleting] = useState(null);

  const onSearch = useCallback((v) => setParam('q', v), [setParam]);
  const categoryOptions = useMemo(() => categoryTreeOptions(categoriesQuery.data ?? []), [categoriesQuery.data]);
  const brandOptions = useMemo(() => (brandsQuery.data ?? []).map((b) => ({ value: String(b._id), label: b.name })), [brandsQuery.data]);

  const filterKeys = ['q', 'category', 'brand', 'status', 'stock', 'sort'];
  const hasFilters = filterKeys.some((k) => params[k] && !(k === 'sort' && params[k] === 'newest'));
  const items = query.data?.items ?? [];

  const columns = productColumns({ onDelete: setDeleting });

  const addButton = (
    <Button to="/admin/products/new" leftIcon={<Plus size={17} />} className="h-10">
      Add Product
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Products"
        description="Manage your catalogue, pricing, variants and visibility."
        actions={addButton}
      />

      <FilterBar
        search={{ value: params.q ?? '', onChange: onSearch, placeholder: 'Search products by name, SKU or tag…' }}
        filters={[
          { key: 'category', label: 'Category', allText: 'All Categories', value: params.category ?? '', options: categoryOptions, onChange: (v) => setParam('category', v) },
          { key: 'brand', label: 'Brand', allText: 'All Brands', value: params.brand ?? '', options: brandOptions, onChange: (v) => setParam('brand', v) },
          { key: 'status', label: 'Status', value: params.status ?? '', options: STATUS_OPTIONS, onChange: (v) => setParam('status', v) },
          { key: 'stock', label: 'Stock', value: params.stock ?? '', options: STOCK_OPTIONS, onChange: (v) => setParam('stock', v) },
          {
            key: 'sort',
            label: 'Sort',
            allLabel: 'Newest',
            value: params.sort === 'newest' ? '' : (params.sort ?? ''),
            options: SORT_OPTIONS,
            onChange: (v) => setParam('sort', v),
          },
        ]}
        onReset={() => reset()}
        activeCount={activeCount}
      />

      <DataTable
        caption="Products"
        minWidth={820}
        columns={columns}
        rows={items}
        loading={query.isPending}
        fetching={query.isFetching}
        error={query.error}
        onRetry={() => query.refetch()}
        pagination={query.data?.pagination}
        onPageChange={(page) => setParam('page', page)}
        onRowClick={(p) => navigate(`/admin/products/${p._id}/edit`)}
        rowLabel={(p) => `Edit ${p.name}`}
        empty={
          hasFilters
            ? {
                icon: <SearchX size={28} strokeWidth={1.5} />,
                title: 'No products match these filters',
                description: 'Try a different search or clear the filters.',
                action: (
                  <Button variant="secondary" size="sm" onClick={() => reset()}>
                    Clear filters
                  </Button>
                ),
              }
            : {
                icon: <Package size={28} strokeWidth={1.5} />,
                title: 'No products yet',
                description: 'Add your first product to start selling.',
                action: addButton,
              }
        }
      />

      <DeleteProductModal product={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
