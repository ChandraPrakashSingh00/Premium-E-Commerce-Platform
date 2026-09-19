import { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { Button, ConfirmationModal, EmptyState, ErrorState, Modal } from '@/components/ui';
import { MAX_ADDRESSES } from '@/features/account/api';
import { AccountPageHeader } from '@/features/account/components/AccountBits';
import { AddressCard, AddressCardSkeleton, AddressLines } from '@/features/account/components/AddressCard';
import { AddressForm } from '@/features/account/components/AddressForm';
import { useAddresses, useDeleteAddress, useSaveAddress, useSetDefaultAddress } from '@/features/account/hooks';

export default function AddressesPage() {
  const { data: addresses = [], isLoading, isError, error, refetch } = useAddresses();
  const save = useSaveAddress();
  const remove = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  // editing: null (closed) | { address?: Address }
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const atLimit = addresses.length >= MAX_ADDRESSES;
  const openNew = () => setEditing({});

  const addButton = (
    <Button leftIcon={<Plus size={16} />} onClick={openNew} disabled={atLimit || isLoading} className="w-full sm:w-auto">
      Add New Address
    </Button>
  );

  return (
    <>
      <Seo title="Addresses" noindex />
      <AccountPageHeader
        title="My Addresses"
        description={`Save up to ${MAX_ADDRESSES} addresses for faster checkout.`}
        action={addresses.length > 0 ? addButton : null}
      />

      {atLimit && (
        <p role="status" className="mb-5 rounded-xl border border-warning-600/20 bg-warning-50 px-4 py-3 text-sm text-warning-600">
          You have reached the limit of {MAX_ADDRESSES} saved addresses. Remove one to add another.
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 *:min-w-0">
          <AddressCardSkeleton />
          <AddressCardSkeleton />
        </div>
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} compact className="card" />
      ) : addresses.length === 0 ? (
        <EmptyState
          className="card"
          icon={<MapPin size={28} strokeWidth={1.5} />}
          title="No saved addresses"
          description="Add a delivery address now and breeze through checkout later."
          action={addButton}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 *:min-w-0">
          {addresses.map((address) => (
            <li key={address._id}>
              <AddressCard
                address={address}
                onEdit={(a) => setEditing({ address: a })}
                onDelete={setDeleting}
                onSetDefault={(a) => setDefault.mutate(a._id)}
                settingDefault={setDefault.isPending && setDefault.variables === address._id}
              />
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => !save.isPending && setEditing(null)}
        title={editing?.address ? 'Edit address' : 'Add a new address'}
        size="lg"
      >
        {editing && (
          <AddressForm
            address={editing.address}
            submitLabel={editing.address ? 'Save changes' : 'Save address'}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              await save.mutateAsync({ id: editing.address?._id, values });
              setEditing(null);
            }}
          />
        )}
      </Modal>

      <ConfirmationModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove this address?"
        confirmLabel="Remove"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(deleting._id, { onSuccess: () => setDeleting(null) })}
      >
        {deleting && (
          <div className="space-y-3">
            <div className="rounded-xl bg-surface p-4">
              <AddressLines address={deleting} />
            </div>
            {deleting.isDefault && addresses.length > 1 && (
              <p className="text-sm text-ink-600">Another saved address will become your default.</p>
            )}
          </div>
        )}
      </ConfirmationModal>
    </>
  );
}
