import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui';
import { getErrorMessage } from '@/services/apiClient';
import { toast } from '@/store/toastStore';
import { useDeleteProduct, useToggleProductPublish } from '../../hooks/useProducts';
import { isConflict } from '../../utils';

/**
 * Delete confirmation. A 409 (open orders) switches the modal to an explanation
 * with an "Unpublish instead" action.
 */
export function DeleteProductModal({ product, onClose }) {
  const [conflict, setConflict] = useState(null);
  const remove = useDeleteProduct();
  const publish = useToggleProductPublish();
  const open = Boolean(product);

  const close = () => {
    setConflict(null);
    onClose();
  };

  const confirmDelete = () =>
    remove.mutate(product._id, {
      onSuccess: close,
      onError: (err) => {
        if (isConflict(err)) setConflict(getErrorMessage(err));
        else toast.error('Could not delete product', getErrorMessage(err));
      },
    });

  const unpublish = () => publish.mutate({ id: product._id, isPublished: false }, { onSuccess: close });

  if (conflict) {
    const canUnpublish = product?.isPublished;
    return (
      <ConfirmationModal
        open={open}
        onClose={close}
        onConfirm={canUnpublish ? unpublish : close}
        title="This product can’t be deleted"
        confirmLabel={canUnpublish ? 'Unpublish instead' : 'Got it'}
        cancelLabel={canUnpublish ? 'Cancel' : 'Close'}
        tone="primary"
        loading={publish.isPending}
      >
        <div className="flex gap-3 rounded-xl bg-warning-50 p-3 text-sm text-ink-700">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning-600" aria-hidden="true" />
          <div>
            <p className="font-medium text-ink-900">{conflict}</p>
            <p className="mt-1">
              {canUnpublish
                ? 'Unpublishing hides it from the store while open orders are completed. You can delete it later.'
                : 'It is already a draft, so shoppers can’t see it. Try again once its open orders are completed.'}
            </p>
          </div>
        </div>
      </ConfirmationModal>
    );
  }

  return (
    <ConfirmationModal
      open={open}
      onClose={close}
      onConfirm={confirmDelete}
      title={`Delete “${product?.name ?? ''}”?`}
      confirmLabel="Delete product"
      loading={remove.isPending}
    >
      <p className="text-sm text-ink-600">
        This permanently removes the product with its variants, inventory, reviews and images, and takes it out of shoppers’ carts and wishlists. Past orders keep their line items.
      </p>
    </ConfirmationModal>
  );
}
