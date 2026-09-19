import { useCallback, useMemo } from 'react';
import { FilterBar, PageHeader } from '@/features/admin/components';
import { CustomerDrawer } from '@/features/admin/components/customers/CustomerDrawer';
import { CustomersTable } from '@/features/admin/components/customers/CustomersTable';
import { useListParams } from '@/features/admin/hooks/shared';
import { useAdminCustomers } from '@/features/admin/hooks/useCustomers';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'blocked', label: 'Blocked' },
];

const SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest' },
  { value: 'name', label: 'Name' },
  { value: 'spent', label: 'Total spent' },
  { value: 'orders', label: 'Most orders' },
];

export default function CustomersPage() {
  const { params, setParam, setParams, reset } = useListParams();
  const { page, q = '', status = '', sort = '', customer: customerId } = params;

  const apiParams = useMemo(() => ({ page, limit: 20, q, status, sort: sort || 'newest' }), [page, q, status, sort]);
  const query = useAdminCustomers(apiParams);

  const onSearch = useCallback((v) => setParam('q', v), [setParam]);
  // The drawer param must not reset pagination, so pass the current page along.
  const openCustomer = useCallback((row) => setParams({ customer: row._id, page }), [setParams, page]);
  const closeCustomer = useCallback(() => setParams({ customer: undefined, page }), [setParams, page]);
  const activeCount = [q, status, sort].filter(Boolean).length;
  const clearFilters = () => reset(['customer']);

  return (
    <>
      <PageHeader title="Customers" description="Search shoppers, review their order history and manage account access." />

      <FilterBar
        search={{ value: q, onChange: onSearch, placeholder: 'Search name, email or phone…', label: 'Search customers' }}
        filters={[
          { key: 'status', label: 'Status', value: status, options: STATUS_OPTIONS, onChange: (v) => setParam('status', v) },
          { key: 'sort', label: 'Sort', value: sort, options: SORT_OPTIONS, allLabel: 'Newest', onChange: (v) => setParam('sort', v) },
        ]}
        activeCount={activeCount}
        onReset={clearFilters}
      />

      <CustomersTable
        query={query}
        onRowClick={openCustomer}
        onPageChange={(p) => setParams({ page: p })}
        hasFilters={activeCount > 0}
        onReset={clearFilters}
      />

      <CustomerDrawer customerId={customerId} onClose={closeCustomer} />
    </>
  );
}
