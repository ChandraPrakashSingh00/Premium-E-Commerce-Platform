import { useCallback, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { FilterBar, PageHeader } from '@/features/admin/components';
import { CouponDeleteDialog } from '@/features/admin/components/coupons/CouponDeleteDialog';
import { CouponDrawer } from '@/features/admin/components/coupons/CouponDrawer';
import { CouponFormModal } from '@/features/admin/components/coupons/CouponFormModal';
import { CouponsTable } from '@/features/admin/components/coupons/CouponsTable';
import { useListParams } from '@/features/admin/hooks/shared';
import { useAdminCoupons, useToggleCoupon } from '@/features/admin/hooks/useCoupons';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'expired', label: 'Expired' },
];

export default function CouponsPage() {
  const { params, setParam, setParams, reset, activeCount } = useListParams();
  const { page, q = '', status = '' } = params;

  const apiParams = useMemo(() => ({ page, limit: 20, q, status }), [page, q, status]);
  const query = useAdminCoupons(apiParams);
  const toggle = useToggleCoupon();

  // form: null = closed, { coupon: null } = create, { coupon } = edit
  const [form, setForm] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const onSearch = useCallback((v) => setParam('q', v), [setParam]);
  const openCreate = () => setForm({ coupon: null });
  const openEdit = (coupon) => {
    setViewingId(null);
    setForm({ coupon });
  };

  const createButton = (
    <Button leftIcon={<Plus size={16} />} onClick={openCreate}>
      Create coupon
    </Button>
  );

  return (
    <>
      <PageHeader title="Coupons" description="Discount codes shoppers can apply at checkout." actions={createButton} />

      <FilterBar
        search={{ value: q, onChange: onSearch, placeholder: 'Search code or description…', label: 'Search coupons' }}
        filters={[{ key: 'status', label: 'Status', value: status, options: STATUS_OPTIONS, onChange: (v) => setParam('status', v) }]}
        activeCount={activeCount}
        onReset={() => reset()}
      />

      <CouponsTable
        query={query}
        onPageChange={(p) => setParams({ page: p })}
        onRowClick={(c) => setViewingId(c._id)}
        onToggle={(c, isActive) => toggle.mutate({ id: c._id, isActive })}
        togglingId={toggle.isPending ? toggle.variables?.id : undefined}
        onEdit={openEdit}
        onDelete={setDeleting}
        hasFilters={activeCount > 0}
        emptyAction={
          activeCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={() => reset()}>
              Clear filters
            </Button>
          ) : (
            createButton
          )
        }
      />

      <CouponDrawer couponId={viewingId} onClose={() => setViewingId(null)} onEdit={openEdit} />
      <CouponFormModal open={Boolean(form)} coupon={form?.coupon ?? null} onClose={() => setForm(null)} />
      <CouponDeleteDialog key={deleting?._id ?? 'none'} coupon={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}
