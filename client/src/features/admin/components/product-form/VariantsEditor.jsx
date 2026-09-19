import { useId, useState } from 'react';
import { Layers, Plus, Wand2 } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button, ConfirmationModal, Input } from '@/components/ui';
import { pluralize } from '@/utils/format';
import { buildVariantCombos, emptyVariant, parseColors, parseList, suggestSku, uniqueSku } from '../../productSchema';
import { FormSection } from '../FormSection';
import { DENSE, useFieldError } from './formHelpers';
import { VariantRow } from './VariantRow';

function VariantGenerator({ onGenerate }) {
  const [sizes, setSizes] = useState('');
  const [colors, setColors] = useState('');
  const [message, setMessage] = useState('');
  const count = Math.max(parseList(sizes).length, 1) * Math.max(parseColors(colors).length, 1);
  const hasInput = parseList(sizes).length > 0 || parseColors(colors).length > 0;

  const generate = () => {
    const added = onGenerate({ sizes, colors });
    setMessage(added ? `Added ${pluralize(added, 'variant')}.` : 'All of these combinations already exist.');
    if (added) {
      setSizes('');
      setColors('');
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (hasInput) generate();
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-ink-300 bg-surface/50 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-900">
        <Wand2 size={16} className="text-ink-500" aria-hidden="true" /> Generate variants
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end [&>*]:min-w-0">
        <Input label="Sizes" placeholder="S, M, L, XL" inputClassName={DENSE} value={sizes} onChange={(e) => setSizes(e.target.value)} onKeyDown={onKeyDown} />
        <Input
          label="Colours"
          placeholder="Black:#111111, Navy:#1e3a8a"
          hint="Optional hex after a colon."
          inputClassName={DENSE}
          value={colors}
          onChange={(e) => setColors(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <Button variant="secondary" size="sm" className="h-10 sm:mb-5" onClick={generate} disabled={!hasInput}>
          Generate{hasInput ? ` ${count}` : ''}
        </Button>
      </div>
      <p className="mt-2 min-h-4 text-xs text-ink-500" aria-live="polite">
        {message}
      </p>
    </div>
  );
}

/** Variant list with size × colour generator, default/active controls and per-variant stock. */
export function VariantsEditor({ isEdit, hasSimpleVariant }) {
  const { control, getValues, setValue } = useFormContext();
  const error = useFieldError();
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });
  const values = useWatch({ control, name: 'variants' }) ?? [];
  const [pendingRemove, setPendingRemove] = useState(null);
  const groupName = useId();

  const ensureDefault = () => {
    const list = getValues('variants') ?? [];
    if (list.length && !list.some((v) => v.isDefault && v.isActive !== false)) {
      const first = list.findIndex((v) => v.isActive !== false);
      list.forEach((v, j) => v.isDefault !== (j === first) && setValue(`variants.${j}.isDefault`, j === first, { shouldDirty: true }));
    }
  };

  const onGenerate = ({ sizes, colors }) => {
    const combos = buildVariantCombos({ sizes, colors, baseSku: getValues('sku'), price: getValues('price'), existing: getValues('variants') ?? [] });
    if (!combos.length) return 0;
    append(combos, { shouldFocus: false });
    ensureDefault();
    return combos.length;
  };

  const addManual = () => {
    const list = getValues('variants') ?? [];
    const taken = new Set(list.map((v) => String(v.sku ?? '').toUpperCase()));
    const sku = uniqueSku(suggestSku(getValues('sku') || 'SKU', String(list.length + 1)), taken);
    append(emptyVariant({ sku, price: getValues('price') ?? '', isDefault: !list.length }));
  };

  const makeDefault = (index) => {
    (getValues('variants') ?? []).forEach((v, j) => {
      if (Boolean(v.isDefault) !== (j === index)) setValue(`variants.${j}.isDefault`, j === index, { shouldDirty: true });
    });
  };

  const doRemove = (index) => {
    remove(index);
    setPendingRemove(null);
    ensureDefault();
  };

  const requestRemove = (index) => {
    if (getValues(`variants.${index}._id`)) setPendingRemove(index);
    else doRemove(index);
  };

  const canRemove = !isEdit || hasSimpleVariant || fields.length > 1;
  const listError = error('variants');
  const pending = pendingRemove !== null ? values[pendingRemove] : null;

  return (
    <FormSection
      id="variants"
      title="Variants"
      description={fields.length ? `${pluralize(fields.length, 'variant')} · each has its own SKU, price and stock.` : 'Add sizes or colours if this product comes in options.'}
      action={
        <Button variant="secondary" size="sm" leftIcon={<Plus size={15} />} onClick={addManual}>
          Add variant
        </Button>
      }
    >
      <VariantGenerator onGenerate={onGenerate} />

      {isEdit && hasSimpleVariant && fields.length > 0 && (
        <p className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-600" role="status">
          Saving with variants replaces the product&apos;s single default SKU and its stock. Remove all variants to keep it.
        </p>
      )}
      {listError && (
        <p className="text-sm font-medium text-danger-600" role="alert">
          {listError}
        </p>
      )}

      {fields.length ? (
        <ul className="space-y-3">
          {fields.map((field, index) => (
            <VariantRow
              key={field.id}
              index={index}
              value={values[index]}
              groupName={groupName}
              canRemove={canRemove}
              onRemove={requestRemove}
              onMakeDefault={makeDefault}
            />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-line px-4 py-8 text-center">
          <Layers size={22} className="mb-2 text-ink-400" aria-hidden="true" />
          <p className="text-sm font-medium text-ink-900">No variants</p>
          <p className="mt-1 max-w-sm text-xs text-ink-500">The product is sold as a single item using the base SKU, price and stock.</p>
        </div>
      )}

      <ConfirmationModal
        open={pending !== null}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => doRemove(pendingRemove)}
        title={`Remove ${pending?.sku || 'this variant'}?`}
        confirmLabel="Remove variant"
      >
        <p className="text-sm text-ink-600">
          When you save, variants with order history are deactivated; others are deleted together with their inventory. To hide it
          temporarily, switch it to inactive instead.
        </p>
      </ConfirmationModal>
    </FormSection>
  );
}
