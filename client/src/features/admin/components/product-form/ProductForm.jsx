import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Badge, Button } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import { toast } from '@/store/toastStore';
import { pluralize } from '@/utils/format';
import { adminKey } from '../../hooks/shared';
import { useCreateProduct, useUpdateProduct } from '../../hooks/useProducts';
import { formToPayload, productFormSchema, productToForm, simpleVariantOf } from '../../productSchema';
import { PageHeader } from '../PageHeader';
import { StatusBadge } from '../StatusBadge';
import { AttributesSection, SeoSection, ShippingSection } from './DetailsSections';
import { GeneralSection, MediaSection } from './GeneralSection';
import { InventorySection, PricingSection } from './PricingInventorySection';
import { LeaveGuard, SaveBar } from './SaveBar';
import { OrganisationPanel, SectionNav, StatusPanel } from './SidePanels';
import { VariantsEditor } from './VariantsEditor';

const FORM_ID = 'product-form';

function scrollToFirstError() {
  requestAnimationFrame(() => {
    const active = document.activeElement;
    if (active?.getAttribute?.('aria-invalid') === 'true') return;
    document.querySelector(`#${FORM_ID} [aria-invalid="true"], #${FORM_ID} [role="alert"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

/** Create / edit form for a product. `product` is the API product in edit mode. */
export function ProductForm({ product }) {
  const isEdit = Boolean(product);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const simpleVariant = simpleVariantOf(product);
  const [busyKey, setBusyKey] = useState(null);
  const [createdId, setCreatedId] = useState(null);

  const methods = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: productToForm(product),
    mode: 'onTouched',
  });
  const { handleSubmit, reset, setError, control, formState } = methods;
  const { isDirty } = formState;

  const createMutation = useCreateProduct({ success: 'Product created' });
  const updateMutation = useUpdateProduct({ success: 'Product saved' });
  const pending = createMutation.isPending || updateMutation.isPending;

  // Navigate only after the reset has committed so the leave guard no longer blocks.
  useEffect(() => {
    if (createdId) navigate(`/admin/products/${createdId}/edit`, { replace: true });
  }, [createdId, navigate]);

  const onServerError = (err) => applyFieldErrors(err, setError);

  const save = (key, publish) =>
    handleSubmit(
      (values) => {
        setBusyKey(key);
        const payload = formToPayload({ ...values, isPublished: publish ?? values.isPublished }, { isEdit });
        if (isEdit) {
          updateMutation.mutate({ id: product._id, input: payload }, { onSuccess: (saved) => reset(productToForm(saved)), onError: onServerError });
        } else {
          createMutation.mutate(payload, {
            onSuccess: (created) => {
              const id = String(created._id);
              queryClient.setQueryData(adminKey('products', 'detail', id), created);
              reset(productToForm(created));
              setCreatedId(id);
            },
            onError: onServerError,
          });
        }
      },
      () => {
        toast.error('Please fix the highlighted fields');
        scrollToFirstError();
      },
    )();

  const published = useWatch({ control, name: 'isPublished' });
  const actions = !isEdit
    ? [
        { key: 'draft', label: 'Save draft', variant: 'secondary', onClick: () => save('draft', false) },
        { key: 'publish', label: 'Publish', variant: 'primary', onClick: () => save('publish', true) },
      ]
    : published
      ? [
          { key: 'draft', label: 'Save as draft', variant: 'secondary', onClick: () => save('draft', false) },
          { key: 'save', label: 'Save', variant: 'primary', onClick: () => save('save') },
        ]
      : [
          { key: 'save', label: 'Save', variant: 'secondary', onClick: () => save('save') },
          { key: 'publish', label: 'Save & publish', variant: 'primary', onClick: () => save('publish', true) },
        ];

  return (
    <FormProvider {...methods}>
      <LeaveGuard when={isDirty && !pending && !createdId} />
      <PageHeader
        back={{ to: '/admin/products', label: 'Products' }}
        title={isEdit ? product.name : 'New product'}
        description={isEdit ? undefined : 'Add details, media, pricing and variants. You can save it as a draft first.'}
        meta={
          isEdit && (
            <>
              <StatusBadge type="publish" value={product.isPublished ? 'published' : 'draft'} />
              <Badge tone="neutral">{pluralize(product.variantCount ?? 0, 'active variant')}</Badge>
              <span className="font-mono text-xs text-ink-500">{product.sku}</span>
            </>
          )
        }
        actions={
          isEdit &&
          product.isPublished && (
            <Button variant="secondary" size="sm" href={`/product/${product.slug}`} leftIcon={<ExternalLink size={15} />}>
              View in store
            </Button>
          )
        }
      />

      <form
        id={FORM_ID}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save('save');
        }}
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
          <div className="min-w-0 space-y-6">
            <GeneralSection isEdit={isEdit} />
            <MediaSection />
            <PricingSection />
            <InventorySection isEdit={isEdit} simpleVariant={simpleVariant} />
            <VariantsEditor isEdit={isEdit} hasSimpleVariant={Boolean(simpleVariant)} />
            <AttributesSection />
            <ShippingSection />
            <SeoSection />
          </div>
          <aside className="min-w-0 space-y-6" aria-label="Product settings">
            <StatusPanel product={product} />
            <OrganisationPanel />
            <div className="sticky top-24">
              <SectionNav />
            </div>
          </aside>
        </div>

        <SaveBar
          dirty={isDirty}
          pending={pending}
          busyKey={busyKey}
          actions={actions}
          onDiscard={isEdit ? () => reset() : undefined}
          savedLabel={isEdit ? 'All changes saved' : 'Not saved yet'}
        />
      </form>
    </FormProvider>
  );
}
