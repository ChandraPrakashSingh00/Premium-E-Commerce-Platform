import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Button, IconButton, Input, Textarea } from '@/components/ui';
import { MAX_KEYWORDS, parseList } from '../../productSchema';
import { config } from '@/config/env';
import { FormSection } from '../FormSection';
import { CountedLabel } from './CountedLabel';
import { DENSE, useFieldError } from './formHelpers';

/** Optional name/value specification rows. */
export function AttributesSection() {
  const { control, register } = useFormContext();
  const error = useFieldError();
  const { fields, append, remove } = useFieldArray({ control, name: 'attributes' });

  return (
    <FormSection
      id="attributes"
      title="Attributes"
      description="Specifications shown on the product page, e.g. Material → 100% linen."
      action={
        <Button variant="secondary" size="sm" leftIcon={<Plus size={15} />} onClick={() => append({ name: '', value: '' })} disabled={fields.length >= 50}>
          Add
        </Button>
      }
    >
      {fields.length === 0 ? (
        <p className="text-sm text-ink-500">No attributes yet.</p>
      ) : (
        <ul className="space-y-3">
          {fields.map((field, i) => (
            <li key={field.id} className="grid grid-cols-[1fr_auto] items-start gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
              <Input
                label="Name"
                placeholder="Material"
                inputClassName={DENSE}
                error={error(`attributes.${i}.name`)}
                {...register(`attributes.${i}.name`)}
              />
              <Input
                label="Value"
                placeholder="100% linen"
                className="col-start-1 sm:col-start-auto"
                inputClassName={DENSE}
                error={error(`attributes.${i}.value`)}
                {...register(`attributes.${i}.value`)}
              />
              <IconButton
                label={`Remove attribute ${i + 1}`}
                size="iconSm"
                className="row-start-1 mt-7 text-ink-500 hover:text-danger-600 sm:row-start-auto"
                onClick={() => remove(i)}
              >
                <Trash2 size={16} />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </FormSection>
  );
}

export function ShippingSection() {
  const { register } = useFormContext();
  const error = useFieldError();
  return (
    <FormSection id="shipping" title="Shipping & returns" description="Leave blank to use the store defaults.">
      <Textarea
        label={<CountedLabel label="Shipping information" name="shippingInfo" max={1000} />}
        rows={3}
        placeholder="Ships in 2–3 business days…"
        error={error('shippingInfo')}
        {...register('shippingInfo')}
      />
      <Textarea
        label={<CountedLabel label="Return policy" name="returnPolicy" max={1000} />}
        rows={3}
        placeholder="Easy 15-day returns…"
        error={error('returnPolicy')}
        {...register('returnPolicy')}
      />
    </FormSection>
  );
}

const truncate = (text, max) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

function SearchPreview() {
  const { control } = useFormContext();
  const [name, slug, shortDescription, title, description] = useWatch({
    control,
    name: ['name', 'slug', 'shortDescription', 'seo.title', 'seo.description'],
  });
  const host = config.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const shownTitle = (title || name || 'Product title').trim();
  const shownDescription = (description || shortDescription || 'Add a meta description to control the snippet shown in search results.').trim();

  return (
    <figure className="rounded-xl border border-line bg-white p-4" aria-label="Search result preview">
      <figcaption className="mb-2 text-xs font-medium text-ink-500">Search preview</figcaption>
      <p className="truncate text-xs text-ink-600">
        {host} › product › {slug || 'product-slug'}
      </p>
      <p className="mt-1 truncate text-lg leading-snug text-brand-700">{truncate(`${shownTitle} | ${config.siteName}`, 65)}</p>
      <p className="mt-1 line-clamp-2 text-sm text-ink-600">{truncate(shownDescription, 170)}</p>
    </figure>
  );
}

export function SeoSection() {
  const { control, register } = useFormContext();
  const error = useFieldError();
  const keywords = useWatch({ control, name: 'seo.keywords' });
  const count = parseList(keywords).length;

  return (
    <FormSection id="seo" title="Search engine listing" description="Defaults to the product name and short description.">
      <SearchPreview />
      <Input
        label={<CountedLabel label="Meta title" name="seo.title" max={70} />}
        placeholder="Relaxed linen shirt for men"
        inputClassName={DENSE}
        error={error('seo.title')}
        {...register('seo.title')}
      />
      <Textarea
        label={<CountedLabel label="Meta description" name="seo.description" max={170} />}
        rows={3}
        error={error('seo.description')}
        {...register('seo.description')}
      />
      <Input
        label="Keywords"
        placeholder="linen shirt, summer shirt"
        hint={`Comma separated · ${count}/${MAX_KEYWORDS}`}
        inputClassName={DENSE}
        error={error('seo.keywords')}
        {...register('seo.keywords')}
      />
    </FormSection>
  );
}
