import { Link } from 'react-router';
import { useFormContext, useWatch } from 'react-hook-form';
import { Input, Select } from '@/components/ui';
import { formatNumber } from '@/utils/format';
import { discountPercent, TAX_RATES } from '../../productSchema';
import { FormSection } from '../FormSection';
import { upperCaseField, useFieldError } from './formHelpers';

const TAX_OPTIONS = TAX_RATES.map((r) => ({ value: String(r), label: `${r}% GST` }));
const moneyProps = { type: 'number', inputMode: 'decimal', min: 0, step: '0.01', leftIcon: <span className="text-sm">₹</span> };

export function PricingSection() {
  const { control, register } = useFormContext();
  const error = useFieldError();
  const [price, compareAtPrice, variants] = useWatch({ control, name: ['price', 'compareAtPrice', 'variants'] });
  const variantCount = variants?.length ?? 0;
  const off = discountPercent(price, compareAtPrice);

  return (
    <FormSection
      id="pricing"
      title="Pricing"
      description={variantCount ? 'Default price for new variants – each variant keeps its own price.' : 'Prices are in rupees, tax inclusive.'}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <Input label="Price" required placeholder="0" error={error('price')} {...moneyProps} {...register('price')} />
        <Input
          label="Compare-at price"
          placeholder="Optional"
          error={error('compareAtPrice')}
          hint={off > 0 ? `Shoppers see ${off}% off` : 'Original price shown struck through.'}
          {...moneyProps}
          {...register('compareAtPrice')}
        />
        <Select label="Tax rate" size="md" options={TAX_OPTIONS} error={error('taxRate')} {...register('taxRate')} />
      </div>
      {off > 0 && (
        <p className="text-sm text-ink-600" aria-live="polite">
          <span className="rounded-md bg-success-50 px-1.5 py-0.5 text-xs font-semibold text-success-600">{off}% off</span> will be shown on
          the product.
        </p>
      )}
    </FormSection>
  );
}

/**
 * Base SKU, initial stock (create, no variants) and low-stock threshold.
 * `simpleVariant` is the only variant of an option-less product (edit mode).
 */
export function InventorySection({ isEdit, simpleVariant }) {
  const { control, register } = useFormContext();
  const error = useFieldError();
  const [variants, sku] = useWatch({ control, name: ['variants', 'sku'] });
  const variantCount = variants?.length ?? 0;
  const inv = simpleVariant?.inventory;

  return (
    <FormSection id="inventory" title="Inventory" description="Stock is tracked per variant and adjusted from Inventory once created.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <Input
          label="Base SKU"
          required
          placeholder="LINEN-SHIRT"
          hint="Letters, numbers, - and _. Used to suggest variant SKUs."
          autoCapitalize="characters"
          spellCheck={false}
          inputClassName="font-mono uppercase"
          error={error('sku')}
          {...upperCaseField(register('sku'))}
        />
        <Input
          label="Low stock threshold"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          placeholder="Store default"
          hint={isEdit ? 'Used for newly added variants; existing ones are managed in Inventory.' : 'Alerts when available units fall to this level.'}
          error={error('lowStockThreshold')}
          {...register('lowStockThreshold')}
        />
        {!isEdit && !variantCount && (
          <Input
            label="Initial stock"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="0"
            hint="Units available when the product is created."
            error={error('stock')}
            {...register('stock')}
          />
        )}
      </div>
      {isEdit && !variantCount && simpleVariant && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3 text-sm">
          <p className="text-ink-700">
            <span className="font-semibold text-ink-900 tabular-nums">{formatNumber(inv?.available ?? simpleVariant.stock ?? 0)}</span> available
            {inv?.reserved > 0 && <span className="text-ink-500 tabular-nums"> · {formatNumber(inv.reserved)} reserved</span>}
          </p>
          <Link to={`/admin/inventory?q=${encodeURIComponent(simpleVariant.sku || sku || '')}`} className="font-medium text-brand-600 hover:underline">
            Adjust in Inventory
          </Link>
        </div>
      )}
      {!isEdit && variantCount > 0 && <p className="text-xs text-ink-500">Initial stock is set per variant below.</p>}
    </FormSection>
  );
}
