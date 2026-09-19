import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Input, Select, Switch } from '@/components/ui';
import { useAdminBrands, useAdminCategories } from '../../hooks/useCatalog';
import { MAX_TAGS, parseList } from '../../productSchema';
import { FormSection } from '../FormSection';
import { StatusBadge } from '../StatusBadge';
import { SECTIONS, useFieldError } from './formHelpers';

const FLAGS = [
  { name: 'isFeatured', label: 'Featured', description: 'Shown in featured collections on the home page.' },
  { name: 'isBestSeller', label: 'Best seller', description: 'Adds a “Best seller” badge.' },
  { name: 'isNewArrival', label: 'New arrival', description: 'Listed under new arrivals.' },
];

function SwitchField({ name, label, description }) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <Switch checked={Boolean(field.value)} onChange={field.onChange} label={label} description={description} />}
    />
  );
}

/** Native select bound as a controlled field (options may load after the form's values). */
function ControlledSelect({ name, onValueChange, ...props }) {
  const { control } = useFormContext();
  const error = useFieldError();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select
          size="sm"
          {...props}
          ref={field.ref}
          name={field.name}
          value={field.value ?? ''}
          onBlur={field.onBlur}
          onChange={(e) => {
            field.onChange(e.target.value);
            onValueChange?.(e.target.value);
          }}
          error={error(name)}
        />
      )}
    />
  );
}

/** Publish status + merchandising flags. */
export function StatusPanel({ product }) {
  const { control } = useFormContext();
  const published = useWatch({ control, name: 'isPublished' });
  return (
    <FormSection
      id="status"
      title="Status"
      action={<StatusBadge type="publish" value={published ? 'published' : 'draft'} />}
    >
      <SwitchField
        name="isPublished"
        label="Published"
        description={published ? 'Visible in the store after saving.' : 'Hidden from the store (draft).'}
      />
      <div className="space-y-4 border-t border-line pt-4">
        {FLAGS.map((flag) => (
          <SwitchField key={flag.name} {...flag} />
        ))}
      </div>
      {product?.slug && product.isPublished && (
        <a
          href={`/product/${product.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline"
        >
          View in store <ExternalLink size={14} aria-hidden="true" />
        </a>
      )}
    </FormSection>
  );
}

/** Category, subcategory, brand and tags. */
export function OrganisationPanel() {
  const { control, register, setValue } = useFormContext();
  const error = useFieldError();
  const categoriesQuery = useAdminCategories();
  const brandsQuery = useAdminBrands();
  const [category, tags] = useWatch({ control, name: ['category', 'tags'] });

  const { topLevel, children } = useMemo(() => {
    const list = categoriesQuery.data ?? [];
    const parentId = (c) => (c.parent ? String(c.parent._id ?? c.parent) : '');
    return {
      topLevel: list.filter((c) => !c.parent).map((c) => ({ value: String(c._id), label: c.isPublished === false ? `${c.name} (hidden)` : c.name })),
      children: list
        .filter((c) => category && parentId(c) === String(category))
        .map((c) => ({ value: String(c._id), label: c.isPublished === false ? `${c.name} (hidden)` : c.name })),
    };
  }, [categoriesQuery.data, category]);

  const brands = (brandsQuery.data ?? []).map((b) => ({ value: String(b._id), label: b.isPublished === false ? `${b.name} (hidden)` : b.name }));
  const tagList = parseList(tags);
  const loadingLabel = (q) => (q.isPending ? 'Loading…' : q.isError ? 'Could not load' : undefined);

  return (
    <FormSection id="organisation" title="Organisation">
      <ControlledSelect
        name="category"
        label="Category"
        required
        placeholder={loadingLabel(categoriesQuery) ?? 'Select a category'}
        options={topLevel}
        onValueChange={() => setValue('subcategory', '', { shouldDirty: true })}
      />
      <ControlledSelect
        name="subcategory"
        label="Subcategory"
        placeholder={!category ? 'Choose a category first' : children.length ? 'None' : 'No subcategories'}
        options={children}
        disabled={!category || !children.length}
      />
      <ControlledSelect
        name="brand"
        label="Brand"
        required
        placeholder={loadingLabel(brandsQuery) ?? 'Select a brand'}
        options={brands}
      />
      <div>
        <Input
          label="Tags"
          placeholder="summer, linen, casual"
          hint={`Comma separated, up to ${MAX_TAGS}. Saved in lowercase.`}
          inputClassName="h-10 rounded-lg"
          error={error('tags')}
          {...register('tags')}
        />
        {tagList.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Tags preview">
            {tagList.map((t) => (
              <li key={t} className="rounded-md bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
                {t.toLowerCase()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </FormSection>
  );
}

/** Jump links for the long form (desktop only). */
export function SectionNav() {
  return (
    <nav aria-label="Form sections" className="hidden rounded-xl border border-line bg-white p-2 xl:block">
      <ul className="space-y-0.5">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="block rounded-lg px-3 py-1.5 text-sm text-ink-600 hover:bg-surface hover:text-ink-900">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
