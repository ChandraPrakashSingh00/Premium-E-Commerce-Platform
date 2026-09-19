import { useState } from 'react';
import { Ban, UserCheck } from 'lucide-react';
import { Button, ConfirmationModal, Drawer, ErrorState, Skeleton, SkeletonText } from '@/components/ui';
import { useAdminCustomer, useSetCustomerStatus } from '../../hooks/useCustomers';
import { AddressList, CustomerHeader, CustomerStats, RecentOrders } from './CustomerDetail';

function DrawerSkeleton() {
  return (
    <div className="space-y-6 px-5 py-5" aria-busy="true">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3.5 w-56" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <SkeletonText lines={4} />
    </div>
  );
}

/** Customer detail drawer; `customerId` comes from the URL so it survives refresh. */
export function CustomerDrawer({ customerId, onClose }) {
  const query = useAdminCustomer(customerId);
  const setStatus = useSetCustomerStatus();
  const [confirming, setConfirming] = useState(false);

  const customer = query.data?.customer;
  const blocked = customer?.status === 'blocked';

  const handleConfirm = () =>
    setStatus.mutate(
      { id: customer._id, status: blocked ? 'active' : 'blocked' },
      { onSettled: () => setConfirming(false) },
    );

  return (
    <>
      <Drawer
        open={Boolean(customerId)}
        onClose={onClose}
        title="Customer"
        className="max-w-xl"
        footer={
          customer && (
            <div className="flex justify-end">
              <Button
                variant={blocked ? 'secondary' : 'danger'}
                leftIcon={blocked ? <UserCheck size={16} /> : <Ban size={16} />}
                onClick={() => setConfirming(true)}
              >
                {blocked ? 'Unblock customer' : 'Block customer'}
              </Button>
            </div>
          )
        }
      >
        {query.isPending && <DrawerSkeleton />}
        {query.isError && <ErrorState error={query.error} onRetry={query.refetch} compact />}
        {customer && (
          <>
            <CustomerHeader customer={customer} />
            <CustomerStats stats={query.data.stats} />
            <RecentOrders orders={query.data.recentOrders} />
            <AddressList addresses={query.data.addresses} />
          </>
        )}
      </Drawer>

      <ConfirmationModal
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        loading={setStatus.isPending}
        tone={blocked ? 'primary' : 'danger'}
        title={blocked ? `Unblock ${customer?.name ?? 'customer'}?` : `Block ${customer?.name ?? 'customer'}?`}
        confirmLabel={blocked ? 'Unblock' : 'Block customer'}
      >
        <p className="text-sm leading-relaxed text-ink-600">
          {blocked
            ? 'They will be able to sign in and place orders again.'
            : 'Blocking signs them out on every device immediately and prevents them from signing in or placing orders until unblocked. Existing orders are not affected.'}
        </p>
      </ConfirmationModal>
    </>
  );
}
