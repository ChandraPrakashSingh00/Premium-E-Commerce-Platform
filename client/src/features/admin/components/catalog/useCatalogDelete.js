import { useState } from 'react';
import { getErrorMessage } from '@/services/apiClient';
import { toast } from '@/store/toastStore';
import { isConflict } from '../../utils';

/**
 * Delete flow shared by categories and brands.
 * `remove` / `toggle` are the mutation objects (delete uses silentError, so errors are handled here).
 */
export function useCatalogDelete({ remove, toggle, errorTitle }) {
  const [target, setTarget] = useState(null);
  const [open, setOpen] = useState(false);
  const [conflict, setConflict] = useState(null);

  const ask = (item) => {
    setTarget(item);
    setConflict(null);
    setOpen(true);
  };
  const close = () => setOpen(false);

  const confirm = () => {
    if (!target) return;
    remove.mutate(target._id, {
      onSuccess: close,
      onError: (err) => {
        if (isConflict(err)) setConflict(getErrorMessage(err, 'It is still in use.'));
        else toast.error(errorTitle, getErrorMessage(err));
      },
    });
  };

  const unpublish = () => {
    if (!target) return;
    toggle.mutate({ id: target._id, isPublished: false }, { onSuccess: close });
  };

  return {
    ask,
    modalProps: {
      open,
      onClose: close,
      name: target?.name ?? '',
      isPublished: Boolean(target?.isPublished),
      conflict,
      onConfirm: confirm,
      deleting: remove.isPending,
      onUnpublish: unpublish,
      unpublishing: toggle.isPending && toggle.variables?.id === target?._id,
    },
  };
}
