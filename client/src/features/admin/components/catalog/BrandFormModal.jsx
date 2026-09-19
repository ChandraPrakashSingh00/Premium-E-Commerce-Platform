import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Modal, Switch } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import { useSaveBrand } from '../../hooks/useCatalog';
import { ImageUploader } from '../ImageUploader';
import { DescriptionField, NameSlugFields, SeoFields } from './FormParts';
import { brandDefaults, brandFormSchema, toBrandPayload } from './schemas';

const FORM_ID = 'brand-form';

/** Create / edit a brand. Remount (via `key`) to reset for a new target. */
export function BrandFormModal({ open, onClose, brand }) {
  const isEdit = Boolean(brand?._id);
  const save = useSaveBrand();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitted },
  } = useForm({ resolver: zodResolver(brandFormSchema), defaultValues: brandDefaults(brand) });

  const onSubmit = (values) =>
    save.mutate({ id: brand?._id, input: toBrandPayload(values) }, { onSuccess: onClose, onError: (err) => applyFieldErrors(err, setError) });

  return (
    <Modal
      open={open}
      onClose={save.isPending ? () => {} : onClose}
      size="lg"
      title={isEdit ? 'Edit brand' : 'Add brand'}
      description={isEdit ? brand.name : 'Brands appear on product pages and in storefront filters.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create brand'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <NameSlugFields register={register} setValue={setValue} errors={errors} slugLocked={isEdit} isSubmitted={isSubmitted} namePlaceholder="e.g. BlueMart Atelier" />
        <DescriptionField register={register} control={control} errors={errors} />

        <Controller
          name="logo"
          control={control}
          render={({ field, fieldState }) => (
            <ImageUploader
              label="Logo"
              folder="brands"
              multiple={false}
              value={field.value}
              onChange={field.onChange}
              hint="A square logo on a transparent or white background works best · JPEG, PNG, WebP or AVIF up to 5 MB"
              error={fieldState.error?.message ?? fieldState.error?.url?.message ?? fieldState.error?.[0]?.url?.message}
            />
          )}
        />

        <Input
          label="Website"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://brand.com"
          error={errors.website?.message}
          {...register('website')}
        />

        <div className="divide-y divide-line rounded-xl border border-line">
          <div className="px-4 py-3">
            <Controller
              name="isPublished"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} label="Published" description="Hidden brands don’t appear in the storefront." />
              )}
            />
          </div>
          <div className="px-4 py-3">
            <Controller
              name="isFeatured"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onChange={field.onChange} label="Featured" description="Show this brand in featured brand sections." />
              )}
            />
          </div>
        </div>

        <SeoFields register={register} control={control} errors={errors} />
      </form>
    </Modal>
  );
}
