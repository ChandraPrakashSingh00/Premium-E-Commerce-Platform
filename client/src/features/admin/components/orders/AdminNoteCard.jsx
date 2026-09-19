import { zodResolver } from '@hookform/resolvers/zod';
import { Check } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Button, Textarea } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import { useOrderNote } from '../../hooks/useOrders';
import { CharCount } from '../FormSection';
import { adminNoteSchema } from './orderForms';
import { SectionCard } from './SectionCard';

/** Internal note (never shown to the customer). */
export function AdminNoteCard({ orderId, adminNote = '' }) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(adminNoteSchema), defaultValues: { adminNote: adminNote ?? '' } });
  const value = useWatch({ control, name: 'adminNote' });
  const mutation = useOrderNote(orderId);

  const onSubmit = ({ adminNote: next }) =>
    mutation.mutate(next, {
      onSuccess: () => reset({ adminNote: next }),
      onError: (err) => applyFieldErrors(err, setError),
    });

  return (
    <SectionCard title="Admin note" description="Internal only – customers never see this.">
      <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <Textarea
          label="Note"
          rows={4}
          placeholder="e.g. Customer asked for gift wrap"
          error={errors.adminNote?.message}
          {...register('adminNote')}
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs" aria-live="polite">
            {isDirty ? (
              <span className="text-warning-600">Unsaved changes</span>
            ) : adminNote ? (
              <span className="inline-flex items-center gap-1 text-ink-500">
                <Check size={13} aria-hidden="true" /> Saved
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-3">
            <CharCount value={value} max={1000} />
            <Button type="submit" size="sm" variant="secondary" loading={mutation.isPending} disabled={!isDirty}>
              Save note
            </Button>
          </div>
        </div>
      </form>
    </SectionCard>
  );
}
