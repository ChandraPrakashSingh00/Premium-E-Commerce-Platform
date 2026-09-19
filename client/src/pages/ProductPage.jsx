import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ArrowLeft, PackageSearch, Share2 } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { FrequentlyBought } from '@/components/product/detail/FrequentlyBought';
import { ProductInfoTabs } from '@/components/product/detail/ProductInfoTabs';
import { PurchasePanel } from '@/components/product/detail/PurchasePanel';
import { StickyPurchaseBar } from '@/components/product/detail/StickyPurchaseBar';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductRail } from '@/components/product/ProductRail';
import { Breadcrumb, Button, EmptyState, ErrorState, Skeleton, SkeletonText } from '@/components/ui';
import { useProduct, useRelatedProducts } from '@/features/products/hooks';
import { productJsonLd } from '@/features/products/seo';
import { useProductPurchase } from '@/features/products/useProductPurchase';
import { ReviewsSection } from '@/features/reviews/components/ReviewsSection';
import { toast } from '@/store/toastStore';

function ProductSkeleton() {
  return (
    <div className="container-page pt-6 pb-16" aria-busy="true" aria-label="Loading product">
      <Skeleton className="h-4 w-56" />
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10 [&>*]:min-w-0">
        <div className="flex gap-4">
          <div className="hidden w-20 flex-col gap-3 lg:flex">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="aspect-square flex-1 rounded-2xl" />
        </div>
        <div>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-9 w-4/5" />
          <Skeleton className="mt-4 h-4 w-40" />
          <Skeleton className="mt-8 h-8 w-36" />
          <SkeletonText className="mt-8" lines={3} />
          <div className="mt-8 flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-11 w-14 rounded-lg" />
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileTopBar({ name }) {
  const navigate = useNavigate();
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch {
      /* dismissed */
    }
  };
  const btn = 'flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink-800 hover:text-brand-600';
  return (
    <div className="flex items-center justify-between sm:hidden">
      <button type="button" className={btn} onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/shop'))} aria-label="Go back">
        <ArrowLeft size={20} />
      </button>
      <button type="button" className={btn} onClick={share} aria-label="Share this product">
        <Share2 size={18} />
      </button>
    </div>
  );
}

function ProductView({ product }) {
  const purchase = useProductPurchase(product);
  const ctaRef = useRef(null);
  const related = useRelatedProducts(product.slug);
  const { hash } = useLocation();
  const [tab, setTab] = useState(() => (hash === '#reviews' ? 'reviews' : 'description'));

  useEffect(() => {
    if (hash === '#reviews') document.getElementById('product-info')?.scrollIntoView({ block: 'start' });
  }, [hash]);

  const showReviews = () => {
    setTab('reviews');
    requestAnimationFrame(() => document.getElementById('product-info')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const crumbs = [
    { label: 'Home', to: '/' },
    ...(product.breadcrumbs?.length
      ? product.breadcrumbs.map((b) => ({ label: b.name, to: `/category/${b.slug}` }))
      : [{ label: 'Shop', to: '/shop' }]),
    { label: product.name },
  ];
  const imageKey = purchase.images.map((i) => i.url).join('|');

  return (
    <>
      <Seo
        title={product.seo?.title || product.name}
        description={product.seo?.description || product.shortDescription}
        image={product.images?.[0]?.url || product.thumbnail}
        type="product"
        canonical={product.seo?.canonicalUrl || undefined}
        jsonLd={productJsonLd(product)}
      />
      <div className="container-page pt-3 sm:pt-6">
        <MobileTopBar name={product.name} />
        <Breadcrumb items={crumbs} className="hidden sm:block" />
        <div className="mt-3 grid grid-cols-1 gap-6 sm:mt-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10 xl:gap-14 [&>*]:min-w-0">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery key={imageKey} images={purchase.images} name={product.name} />
          </div>
          <div className="lg:py-1">
            <PurchasePanel ref={ctaRef} product={product} purchase={purchase} onShowReviews={showReviews} />
          </div>
        </div>

        <div className="mt-10 lg:mt-14">
          <ProductInfoTabs product={product} value={tab} onChange={setTab} reviews={<ReviewsSection product={product} />} />
        </div>

        <div className="mt-6 lg:mt-8">
          <FrequentlyBought product={product} />
        </div>
      </div>

      <ProductRail
        title="You May Also Like"
        items={related.data ?? []}
        loading={related.isPending}
        error={related.isError ? related.error : null}
        onRetry={() => related.refetch()}
        viewAllTo={product.category?.slug ? `/category/${product.category.slug}` : '/shop'}
        className="pt-10! sm:pt-14!"
      />
      <StickyPurchaseBar product={product} purchase={purchase} targetRef={ctaRef} />
    </>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const { data: product, isPending, isError, error, refetch } = useProduct(slug);

  if (isPending) return <ProductSkeleton />;

  if (isError) {
    if (error?.status === 404) {
      return (
        <div className="container-page">
          <Seo title="Product not found" noindex />
          <EmptyState
            icon={<PackageSearch size={28} strokeWidth={1.5} />}
            title="This product isn’t available"
            description="It may have sold out for good or the link may be incorrect. Explore similar pieces in our shop."
            action={
              <>
                <Button to="/shop">
                  Continue Shopping
                </Button>
                <Button to="/search" variant="secondary">
                  Search Products
                </Button>
              </>
            }
          />
        </div>
      );
    }
    return (
      <div className="container-page">
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  return <ProductView key={product._id} product={product} />;
}
