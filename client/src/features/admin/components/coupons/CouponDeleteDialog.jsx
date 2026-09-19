import { useState } from 'react';
import { Button, ConfirmationModal, Modal } from '@/components/ui';
import { getErrorMessage } from '@/services/apiClient';
import { toast } from '@/store/toastStore';
import { useDeleteCoupon, useToggleCoupon } from '../../hooks/useCoupons';
import { isConflict } from '../../utils';

/** Delete confirmation; on 409 (coupon already used) offers to deactivate instead. */
export function CouponDeleteDialog({ coupon, onClose }) {
  const remove = useDeleteCoupon();
  const toggle = useToggleCoupon();
  const [conflict, setConflict] = useState(null);

  const close = () => {
    setConflict(null);
    onClose();
  };

  const confirm = () =>
    remove.mutate(coupon._id, {
      onSuccess: close,
      onError: (err) => {
        if (isConflict(err)) setConflict(getErrorMessage(err));
        else {
          toast.error('Could not delete coupon', getErrorMessage(err));
          close();
        }
      },
    });

  const deactivate = () => toggle.mutate({ id: coupon._id, isActive: false }, { onSettled: close });

  if (conflict) {
    return (
      <Modal
        open
        onClose={toggle.isPending ? () => {} : close}
        size="sm"
        title="This coupon can't be deleted"
        footer={
          <>
            <Button variant="secondary" onClick={close} disabled={toggle.isPending}>
              Keep it
            </Button>
            {coupon?.isActive && (
              <Button onClick={deactivate} loading={toggle.isPending} data-autofocus>
                Deactivate instead
              </Button>
            )}
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-600">{conflict}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">
          {coupon?.isActive
            ? `${coupon.code} has already been redeemed, so it is kept for order history. Deactivate it to stop further use.`
            : `${coupon?.code} has already been redeemed and is kept for order history. It is already inactive, so shoppers can't use it.`}
        </p>
      </Modal>
    );
  }

  return (
    <ConfirmationModal
      open={Boolean(coupon)}
      onClose={close}
      onConfirm={confirm}
      loading={remove.isPending}
      title={`Delete ${coupon?.code ?? 'coupon'}?`}
      confirmLabel="Delete coupon"
    >
      <p className="text-sm leading-relaxed text-ink-600">
        The code will stop working immediately. Coupons that have already been used can't be deleted – you can deactivate them instead.
      </p>
    </ConfirmationModal>
  );
}
