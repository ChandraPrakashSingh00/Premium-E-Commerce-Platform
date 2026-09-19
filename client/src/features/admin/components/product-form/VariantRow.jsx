import { Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { Controller, useFormContext } from 'react-hook-form';
import { IconButton, Input, Switch } from '@/components/ui';
import { formatNumber } from '@/utils/format';
import { cn } from '@/utils/cn';
import { HEX_REGEX } from '../../productSchema';
import { DENSE, upperCaseField, useFieldError } from './formHelpers';

const toColorInput = (hex) => {
  if (!HEX_REGEX.test(hex ?? '')) return '#000000';
  if (hex.length === 4) return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toLowerCase();
  return hex.slice(0, 7).toLowerCase();
};

const small = { inputClassName: DENSE };
const money = { type: 'number', inputMode: 'decimal', min: 0, step: '0.01', ...small };

/** One editable variant card (stacked on mobile, single dense row on xl). */
export function VariantRow({ index, value, groupName, canRemove, onRemove, onMakeDefault }) {
  const { control, register, setValue } = useFormContext();
  const error = useFieldError();
  const base = `variants.${index}`;
  const existing = Boolean(value?._id);
  const inv = value?.inventory;
  const rowError = error(base);
  const label = value?.sku || `Variant ${index + 1}`;

  return (
    <li className={cn('rounded-xl border bg-white p-4', rowError ? 'border-danger-500' : 'border-line', value?.isActive === false && 'bg-surface/60')}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-mono text-xs font-semibold text-ink-900">{label}</span>
          {existing ? (
            <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-600">Saved</span>
          ) : (
            <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[11px] font-medium text-brand-700">New</span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input
              type="radio"
              name={groupName}
              checked={Boolean(value?.isDefault)}
              onChange={() => onMakeDefault(index)}
              disabled={value?.isActive === false}
              className="h-4 w-4 accent-brand-500"
            />
            Default
          </label>
          <Controller
            control={control}
            name={`${base}.isActive`}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Switch id={`${groupName}-active-${index}`} checked={field.value !== false} onChange={field.onChange} />
                <label htmlFor={`${groupName}-active-${index}`} className="text-sm text-ink-700">
                  {field.value !== false ? 'Active' : 'Inactive'}
                </label>
              </div>
            )}
          />
          <IconButton
            label={canRemove ? `Remove variant ${label}` : 'A product needs at least one variant'}
            size="iconSm"
            onClick={() => onRemove(index)}
            disabled={!canRemove}
            className="text-ink-500 hover:text-danger-600"
          >
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-[minmax(0,1.6fr)_repeat(2,minmax(0,1fr))_minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
        <Input
          label="SKU"
          required
          className="col-span-2 sm:col-span-2 xl:col-span-1"
          inputClassName={cn(DENSE, 'font-mono text-xs uppercase')}
          spellCheck={false}
          error={error(`${base}.sku`)}
          {...upperCaseField(register(`${base}.sku`))}
        />
        <Input label="Size" placeholder="M" {...small} error={error(`${base}.size`)} {...register(`${base}.size`)} />
        <Input label="Colour" placeholder="Navy" {...small} error={error(`${base}.color`)} {...register(`${base}.color`)} />
        <div className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <label htmlFor={`${groupName}-hex-${index}`} className="text-sm font-medium text-ink-800">
            Colour hex
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              aria-label={`Pick colour for ${label}`}
              value={toColorInput(value?.colorHex)}
              onChange={(e) => setValue(`${base}.colorHex`, e.target.value, { shouldDirty: true, shouldValidate: true })}
              className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-line bg-white p-1"
            />
            <input
              id={`${groupName}-hex-${index}`}
              placeholder="#1f2937"
              spellCheck={false}
              aria-invalid={error(`${base}.colorHex`) ? true : undefined}
              className={cn(
                'h-10 w-full min-w-0 rounded-lg border px-3 font-mono text-xs focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 focus:outline-none',
                error(`${base}.colorHex`) ? 'border-danger-500' : 'border-line',
              )}
              {...register(`${base}.colorHex`)}
            />
          </div>
          {error(`${base}.colorHex`) && <p className="text-xs font-medium text-danger-600">{error(`${base}.colorHex`)}</p>}
        </div>
        <Input label="Price" required {...money} error={error(`${base}.price`)} {...register(`${base}.price`)} />
        <Input label="Compare-at" placeholder="—" {...money} error={error(`${base}.compareAtPrice`)} {...register(`${base}.compareAtPrice`)} />
        {existing ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink-800">Stock</span>
            <p className="flex h-10 items-center text-sm text-ink-700 tabular-nums">
              {inv ? (
                <>
                  <span className="font-semibold text-ink-900">{formatNumber(inv.available)}</span>
                  {inv.reserved > 0 && <span className="ml-1 text-xs text-ink-500">+{formatNumber(inv.reserved)} reserved</span>}
                </>
              ) : (
                <span className="text-ink-400">—</span>
              )}
            </p>
            <Link to={`/admin/inventory?q=${encodeURIComponent(value.sku ?? '')}`} className="text-xs font-medium text-brand-600 hover:underline">
              Adjust in Inventory
            </Link>
          </div>
        ) : (
          <Input
            label="Initial stock"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="0"
            {...small}
            error={error(`${base}.stock`)}
            {...register(`${base}.stock`)}
          />
        )}
      </div>
      {rowError && (
        <p className="mt-2 text-xs font-medium text-danger-600" role="alert">
          {rowError}
        </p>
      )}
    </li>
  );
}
