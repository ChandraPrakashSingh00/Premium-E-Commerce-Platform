import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Input, Textarea } from '@/components/ui';
import { FormSection } from '../FormSection';
import { ImageUploader } from '../ImageUploader';
import { slugify } from '../../utils';
import { MAX_IMAGES } from '../../productSchema';
import { CountedLabel } from './CountedLabel';
import { useFieldError } from './formHelpers';

/** Name, slug (auto from name until edited), descriptions. */
export function GeneralSection({ isEdit }) {
  const { register, setValue, getValues } = useFormContext();
  const error = useFieldError();
  // On create the slug follows the name until the user types their own.
  const [slugLocked, setSlugLocked] = useState(isEdit);
  const nameField = register('name');
  const slugField = register('slug');

  const onNameChange = (e) => {
    nameField.onChange(e);
    if (!slugLocked) setValue('slug', slugify(e.target.value), { shouldDirty: true, shouldValidate: Boolean(getValues('slug')) });
  };
  const onSlugChange = (e) => {
    slugField.onChange(e);
    setSlugLocked(e.target.value.trim() !== '');
  };

  return (
    <FormSection id="general" title="General" description="What shoppers see first.">
      <Input label="Product name" required placeholder="e.g. Relaxed linen shirt" error={error('name')} {...nameField} onChange={onNameChange} />
      <Input
        label="URL slug"
        hint="Generated from the name. Leave blank to auto-generate."
        placeholder="relaxed-linen-shirt"
        leftIcon={<span className="text-xs">/product/</span>}
        inputClassName="pl-20"
        autoCapitalize="none"
        spellCheck={false}
        error={error('slug')}
        {...slugField}
        onChange={onSlugChange}
      />
      <Textarea
        label={<CountedLabel label="Short description" name="shortDescription" max={300} />}
        rows={2}
        placeholder="One or two lines used on cards and in search results."
        error={error('shortDescription')}
        {...register('shortDescription')}
      />
      <Textarea
        label={<CountedLabel label="Description" name="description" max={10000} />}
        rows={8}
        placeholder="Materials, fit, care instructions…"
        error={error('description')}
        {...register('description')}
      />
    </FormSection>
  );
}

export function MediaSection() {
  const { control } = useFormContext();
  const error = useFieldError();
  return (
    <FormSection id="media" title="Media" description={`Up to ${MAX_IMAGES} images. The first image is the cover.`}>
      <Controller
        control={control}
        name="images"
        render={({ field }) => (
          <ImageUploader
            value={field.value ?? []}
            onChange={field.onChange}
            folder="products"
            max={MAX_IMAGES}
            label="Product images"
            hint="JPEG, PNG, WebP or AVIF up to 5 MB. Use the arrows to reorder."
            error={error('images')}
          />
        )}
      />
    </FormSection>
  );
}
