import { useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { Button, Input, Modal, Textarea } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/format';
import { useAdjustInventory } from '../../hooks/useInventory';
import { stockState } from '../../utils';
import { StatusBadge } from '../StatusBadge';
import { ADJUST_MODES, makeAdjustSchema, nextAvailable } from './inventoryUtils';

const FORM_ID = 'adjust-stock-form';

function ModePicker({ register, current }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink-800">Adjustment</legend>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-ink-100 p-1">
        {ADJUST_MODES.map((m) => (
          <label
            key={m.value}
            className={cn(
              'flex cursor-pointer flex-col items-center rounded-lg px-2 py-2 text-center transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-500',
              current === m.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900',
            )}
          >
            <input type="radio" value={m.value} className="sr-only" {...register('mode')} />
            <span className="text-sm font-semibold">{m.label}</span>
            <span className="hidden text-[11px] text-ink-500 sm:block">{m.description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Preview({ item, mode, quantity, threshold }) {
  const before = item.available ?? 0;
  const after = nextAvailable(before, mode, quantity);
  const limit = threshold === '' || threshold === undefined || Number.isNaN(Number(threshold)) ? item.lowStockThreshold : Number(threshold);
  const invalid = after < 0;
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3', invalid ? 'border-danger-500 bg-danger-50' : 'border-line bg-surface/60')} aria-live="polite">
      <p className="flex items-center gap-2 text-sm text-ink-600">
        Available:
        <span className="font-semibold text-ink-900 tabular-nums">{formatNumber(before)}</span>
        <ArrowRight size={14} aria-hidden="true" />
        <span className="sr-only">becomes</span>
        <span className={cn('font-semibold tabular-nums', invalid ? 'text-danger-600' : after === before ? 'text-ink-900' : 'text-brand-600')}>
          {invalid ? after : formatNumber(after)}
        </span>
      </p>
      {invalid ? <span className="text-xs font-medium text-danger-600">Can’t go below 0</span> : <StatusBadge type="stock" value={stockState(after, limit)} />}
    </div>
  );
}

/** Manual stock adjustment (audited as an ADJUSTMENT transaction). Remount per item via `key`. */
export function AdjustStockModal({ open, onClose, item }) {
  const adjust = useAdjustInventory();
  const available = item?.available ?? 0;
  const schema = useMemo(() => makeAdjustSchema(available), [available]);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { mode: 'increment', quantity: '', reason: '', lowStockThreshold: item?.lowStockThreshold ?? '' },
  });
  const [mode, quantity, threshold] = useWatch({ control, name: ['mode', 'quantity', 'lowStockThreshold'] });

  const onSubmit = (values) => {
    const input = { mode: values.mode, quantity: values.quantity, reason: values.reason };
    if (values.lowStockThreshold !== undefined) input.lowStockThreshold = values.lowStockThreshold;
    adjust.mutate({ id: item._id, input }, { onSuccess: onClose, onError: (err) => applyFieldErrors(err, setError) });
  };

  const variant = [item?.variant?.title, item?.variant?.size, item?.variant?.color].filter(Boolean).join(' · ');

  return (
    <Modal
      open={open}
      onClose={adjust.isPending ? () => {} : onClose}
      title="Adjust stock"
      description={item ? `${item.product?.name ?? 'Product'}${variant ? ` — ${variant}` : ''} · SKU ${item.sku}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={adjust.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={adjust.isPending}>
            Save adjustment
          </Button>
        </>
      }
    >
      {item && (
        <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <ModePicker register={register} current={mode} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
            <Input
              label={mode === 'set' ? 'New available quantity' : 'Quantity'}
              type="number"
              inputMode="numeric"
              min={mode === 'set' ? 0 : 1}
              max={mode === 'decrement' ? available : 1_000_000}
              step={1}
              required
              autoFocus
              error={errors.quantity?.message}
              {...register('quantity')}
            />
            <Input
              label="Low-stock threshold"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              hint="Alert when available ≤ this."
              error={errors.lowStockThreshold?.message}
              {...register('lowStockThreshold')}
            />
          </div>
          <Preview item={item} mode={mode} quantity={quantity} threshold={threshold} />
          <Textarea
            label="Reason"
            required
            rows={2}
            maxLength={300}
            placeholder="e.g. Received purchase order PO-1042"
            hint="Recorded in the stock history."
            error={errors.reason?.message}
            {...register('reason')}
          />
        </form>
      )}
    </Modal>
  );
}
