import { useParams } from 'react-router';
import { ErrorState, Skeleton } from '@/components/ui';
import { PageHeader } from '@/features/admin/components';
import { ProductForm } from '@/features/admin/components/product-form/ProductForm';
import { useAdminProduct } from '@/features/admin/hooks/useProducts';

function FormSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product">
      <Skeleton className="mb-3 h-4 w-24" />
      <Skeleton className="mb-8 h-8 w-72 max-w-full" />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px] [&>*]:min-w-0">
        <div className="space-y-6">
          {[220, 180, 160].map((h) => (
            <div key={h} className="rounded-xl border border-line bg-white p-6">
              <Skeleton className="mb-5 h-5 w-32" />
              <Skeleton className="w-full rounded-xl" style={{ height: h }} />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {[1, 2].map((k) => (
            <div key={k} className="rounded-xl border border-line bg-white p-6">
              <Skeleton className="mb-5 h-5 w-24" />
              <Skeleton className="mb-3 h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductFormPage() {
  const { id } = useParams();
  const query = useAdminProduct(id);

  if (!id) return <ProductForm key="new" />;
  if (query.isPending) return <FormSkeleton />;
  if (!query.data) {
    return (
      <>
        <PageHeader title="Edit product" back={{ to: '/admin/products', label: 'Products' }} />
        <div className="rounded-xl border border-line bg-white">
          <ErrorState
            error={query.error}
            title={query.error?.status === 404 ? 'Product not found' : undefined}
            description={query.error?.status === 404 ? 'It may have been deleted. Go back to the product list.' : undefined}
            onRetry={() => query.refetch()}
          />
        </div>
      </>
    );
  }
  return <ProductForm key={id} product={query.data} />;
}
