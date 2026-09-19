import { useId } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button, Modal, Textarea } from '@/components/ui';
import { noteSchema } from './orderForms';

function NoteForm({ formId, onSubmit, noteLabel, children }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(noteSchema), defaultValues: { note: '' } });
  return (
    <form id={formId} noValidate onSubmit={handleSubmit((v) => onSubmit(v.note || undefined))} className="space-y-4">
      {children}
      <Textarea label={noteLabel} rows={3} placeholder="Optional" error={errors.note?.message} {...register('note')} />
    </form>
  );
}

/** Confirm an action with an optional note (form state resets each time the modal opens). */
export function NoteActionModal({ open, onClose, title, description, confirmLabel, tone = 'primary', loading, onSubmit, noteLabel = 'Note', children }) {
  const formId = useId();
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form={formId} variant={tone === 'danger' ? 'danger' : 'primary'} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <NoteForm formId={formId} onSubmit={onSubmit} noteLabel={noteLabel}>
        {children}
      </NoteForm>
    </Modal>
  );
}
