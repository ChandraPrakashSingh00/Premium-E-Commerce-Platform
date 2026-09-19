import { AlertTriangle, EyeOff } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

/**
 * Delete confirmation for categories / brands. When the server refuses (409) the
 * `conflict` message is shown with an "Unpublish instead" alternative.
 */
export function CatalogDeleteModal({
  open,
  onClose,
  entity = 'category',
  name,
  conflictHint,
  conflict,
  onConfirm,
  deleting,
  onUnpublish,
  unpublishing,
  isPublished,
}) {
  const busy = deleting || unpublishing;
  const close = busy ? () => {} : onClose;
  return (
    <Modal
      open={open}
      onClose={close}
      size="sm"
      title={conflict ? `Can’t delete this ${entity}` : `Delete ${entity}?`}
      footer={
        conflict ? (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              {isPublished ? 'Keep as is' : 'Close'}
            </Button>
            {isPublished && (
              <Button onClick={onUnpublish} loading={unpublishing} leftIcon={<EyeOff size={16} />}>
                Unpublish instead
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm} loading={deleting} data-autofocus>
              Delete {entity}
            </Button>
          </>
        )
      }
    >
      {conflict ? (
        <div className="space-y-3 text-sm">
          <div className="flex gap-3 rounded-xl bg-warning-50 p-3 text-warning-600" role="alert">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p className="font-medium">{conflict}</p>
          </div>
          <p className="text-ink-600">{conflictHint}</p>
          <p className="text-ink-600">
            {isPublished
              ? `You can unpublish “${name}” instead – it will be hidden from the storefront but its data stays intact.`
              : `“${name}” is already hidden from the storefront.`}
          </p>
        </div>
      ) : (
        <p className="text-sm text-ink-600">
          <span className="font-semibold text-ink-900">“{name}”</span> will be permanently removed. This action cannot be undone.
        </p>
      )}
    </Modal>
  );
}
