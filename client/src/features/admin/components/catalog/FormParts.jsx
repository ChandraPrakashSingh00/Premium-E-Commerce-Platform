import { useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Input, Textarea } from '@/components/ui';
import { slugify } from '../../utils';
import { CharCount } from '../FormSection';

/** Name + slug pair; slug follows the name until the admin edits it by hand. */
export function NameSlugFields({ register, setValue, errors, slugLocked = false, namePlaceholder, isSubmitted }) {
  const [edited, setEdited] = useState(slugLocked);
  const name = register('name', {
    onChange: (e) => {
      if (!edited) setValue('slug', slugify(e.target.value), { shouldValidate: isSubmitted, shouldDirty: true });
    },
  });
  const slug = register('slug', {
    onChange: (e) => setEdited(e.target.value.trim() !== ''),
  });
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
      <Input label="Name" required autoComplete="off" maxLength={80} placeholder={namePlaceholder} error={errors.name?.message} {...name} />
      <Input
        label="Slug"
        autoComplete="off"
        spellCheck={false}
        maxLength={120}
        placeholder="auto-generated"
        hint={edited ? 'Used in the storefront URL.' : 'Generated from the name – edit to customise.'}
        error={errors.slug?.message}
        inputClassName="font-mono text-[13px]"
        {...slug}
      />
    </div>
  );
}

function LabelWithCount({ label, control, name, max }) {
  const value = useWatch({ control, name });
  return (
    <span className="flex w-full items-center justify-between gap-2">
      <span>{label}</span>
      <CharCount value={value} max={max} />
    </span>
  );
}

/** SEO block shared by the category and brand forms. */
export function SeoFields({ register, control, errors }) {
  const seo = errors.seo ?? {};
  return (
    <fieldset className="space-y-4 rounded-xl border border-line p-4">
      <legend className="px-1 text-sm font-semibold text-ink-900">Search engine listing</legend>
      <p className="-mt-1 text-xs text-ink-500">Leave blank to use the name and description.</p>
      <Input
        label={<LabelWithCount label="SEO title" control={control} name="seo.title" max={70} />}
        error={seo.title?.message}
        {...register('seo.title')}
      />
      <Textarea
        label={<LabelWithCount label="SEO description" control={control} name="seo.description" max={170} />}
        rows={3}
        error={seo.description?.message}
        {...register('seo.description')}
      />
      <Input
        label="Keywords"
        hint="Comma separated, up to 20."
        placeholder="e.g. linen, summer, shirts"
        error={seo.keywords?.message}
        {...register('seo.keywords')}
      />
    </fieldset>
  );
}

/** Label for the description with a live counter. */
export function DescriptionField({ register, control, errors, max = 1000 }) {
  return (
    <Textarea
      label={<LabelWithCount label="Description" control={control} name="description" max={max} />}
      rows={3}
      error={errors.description?.message}
      {...register('description')}
    />
  );
}
