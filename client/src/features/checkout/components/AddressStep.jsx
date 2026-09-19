import { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { Button, ConfirmationModal, ErrorState } from '@/components/ui';
import { MAX_ADDRESSES } from '@/features/account/api';
import { AddressCardSkeleton } from '@/features/account/components/AddressCard';
import { AddressForm } from '@/features/account/components/AddressForm';
import { useAddresses, useDeleteAddress, useSaveAddress } from '@/features/account/hooks';
import { STEP_FORM_ID } from '../useCheckout';
import { resolveSelectedAddress } from '../utils';
import { AddressOption } from './AddressOption';

export function AddressStep({ addressId, onSelect, onConfirm, adding, setAdding, contact }) {
  const { data: addresses = [], isLoading, isError, error, refetch } = useAddresses();
  const save = useSaveAddress();
  const remove = useDeleteAddress();
  const [editing, setEditing] = useState(null);
  const [removing, setRemoving] = useState(null);
  const selected = resolveSelectedAddress(addresses, addressId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 *:min-w-0">
        <AddressCardSkeleton />
        <AddressCardSkeleton />
      </div>
    );
  }
  if (isError) return <ErrorState compact error={error} onRetry={refetch} />;

  const openForm = (address = null) => {
    setEditing(address);
    setAdding(true);
  };
  const closeForm = () => {
    setEditing(null);
    setAdding(false);
  };

  if (adding || addresses.length === 0) {
    const current = adding ? editing : null;
    return (
      <div>
        <p className="mb-4 text-sm font-medium text-ink-700">
          {current ? 'Update this delivery address.' : addresses.length ? 'Add a new delivery address.' : 'Where should we deliver your order?'}
        </p>
        <AddressForm
          key={current?._id ?? 'new'}
          formId={STEP_FORM_ID}
          address={current ?? { fullName: contact.name, phone: contact.phone }}
          submitLabel="Save & Deliver Here"
          actionsClassName="hidden lg:flex"
          showDefaultToggle={addresses.length > 0}
          onCancel={addresses.length ? closeForm : undefined}
          onSubmit={async (values) => {
            const saved = await save.mutateAsync({ id: current?._id, values });
            setEditing(null);
            onConfirm(saved?._id ?? current?._id);
          }}
        />
        {addresses.length > 0 && (
          <button type="button" onClick={closeForm} className="mt-4 min-h-10 text-sm font-semibold text-brand-600 hover:underline lg:hidden">
            Choose a saved address instead
          </button>
        )}
      </div>
    );
  }

  const confirmRemove = () =>
    remove
      .mutateAsync(removing._id)
      .then(() => setRemoving(null))
      .catch(() => {});

  return (
    <>
      <form
        id={STEP_FORM_ID}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (selected) onConfirm(selected._id);
        }}
      >
        <fieldset>
          <legend className="sr-only">Choose a delivery address</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 *:min-w-0">
            {addresses.map((address) => (
              <AddressOption
                key={address._id}
                address={address}
                checked={selected?._id === address._id}
                onSelect={onSelect}
                onEdit={openForm}
                onRemove={setRemoving}
                disabled={remove.isPending}
              />
            ))}
          </div>
        </fieldset>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => openForm(null)}
            disabled={addresses.length >= MAX_ADDRESSES}
            className="inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-dashed border-brand-300 px-4 text-sm font-semibold text-brand-600 hover:bg-brand-50 disabled:opacity-40"
          >
            <Plus size={16} aria-hidden="true" /> Add New Address
          </button>
          <div className="hidden lg:block">
            <Button type="submit" rightIcon={<ArrowRight size={18} aria-hidden="true" />} disabled={!selected}>
              Deliver Here
            </Button>
          </div>
        </div>
        {addresses.length >= MAX_ADDRESSES && <p className="mt-2 text-xs text-ink-500">You have saved the maximum of {MAX_ADDRESSES} addresses.</p>}
      </form>

      <ConfirmationModal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        loading={remove.isPending}
        title="Remove this address?"
        description={removing ? `${removing.fullName}, ${removing.city} ${removing.postalCode}` : undefined}
        confirmLabel="Remove"
      />
    </>
  );
}
