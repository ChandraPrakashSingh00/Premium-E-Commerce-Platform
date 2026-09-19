import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, Modal, Select, Switch } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import { useSaveCategory } from '../../hooks/useCatalog';
import { ImageUploader } from '../ImageUploader';
import { parentOptions } from './categoryTree';
import { DescriptionField, NameSlugFields, SeoFields } from './FormParts';
import { categoryDefaults, categoryFormSchema, toCategoryPayload } from './schemas';

const FORM_ID = 'category-form';

/** Create / edit a category. Remount (via `key`) to reset for a new target. */
export function CategoryFormModal({ open, onClose, category, categories = [] }) {
  const isEdit = Boolean(category?._id);
  const save = useSaveCategory();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitted },
  } = useForm({ resolver: zodResolver(categoryFormSchema), defaultValues: categoryDefaults(category) });

  const options = useMemo(() => parentOptions(categories, category?._id), [categories, category?._id]);

  const onSubmit = (values) =>
    save.mutate(
      { id: category?._id, input: toCategoryPayload(values) },
      { onSuccess: onClose, onError: (err) => applyFieldErrors(err, setError) },
    );

  const close = save.isPending ? () => {} : onClose;

  return (
    <Modal
      open={open}
      onClose={close}
      size="lg"
      title={isEdit ? 'Edit category' : 'Add category'}
      description={isEdit ? category.name : 'Categories organise products in the storefront navigation.'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <NameSlugFields register={register} setValue={setValue} errors={errors} slugLocked={isEdit} isSubmitted={isSubmitted} namePlaceholder="e.g. Shirts" />
        <DescriptionField register={register} control={control} errors={errors} />

        <Controller
          name="image"
          control={control}
          render={({ field, fieldState }) => (
            <ImageUploader
              label="Image"
              folder="categories"
              multiple={false}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message ?? fieldState.error?.url?.message ?? fieldState.error?.[0]?.url?.message}
            />
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <Select
            label="Parent category"
            placeholder="None (top level)"
            options={options}
            hint="Nesting under itself or its subcategories isn’t allowed."
            error={errors.parent?.message}
            {...register('parent')}
          />
          <Input
            label="Sort order"
            type="number"
            inputMode="numeric"
            min={0}
            max={10000}
            step={1}
            hint="Lower numbers appear first."
            error={errors.sortOrder?.message}
            {...register('sortOrder')}
          />
        </div>

        <div className="rounded-xl border border-line px-4 py-3">
          <Controller
            name="isPublished"
            control={control}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onChange={field.onChange}
                label="Published"
                description="Hidden categories don’t appear in the storefront."
              />
            )}
          />
        </div>

        <SeoFields register={register} control={control} errors={errors} />
      </form>
    </Modal>
  );
}
