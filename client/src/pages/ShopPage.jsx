import { useSearchParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { ListingHeader } from '@/components/product/ListingHeader';
import { ProductListing } from '@/components/product/ProductListing';

const COLLECTIONS = {
  newArrival: { title: 'New Arrivals', eyebrow: 'Just Landed', description: 'The latest additions to the BlueMart edit — refreshed every week.' },
  bestSeller: { title: 'Best Sellers', eyebrow: 'Customer Favourites', description: 'The pieces our customers keep coming back for.' },
  featured: { title: 'The Collection', eyebrow: 'Curated', description: 'Our buying team’s favourite pieces this season.' },
};

export default function ShopPage() {
  const [searchParams] = useSearchParams();
  const key = Object.keys(COLLECTIONS).find((k) => searchParams.get(k) === 'true');
  const meta = COLLECTIONS[key] ?? {
    title: 'Shop',
    eyebrow: undefined,
    description: 'Fashion, footwear, electronics, beauty and home — thoughtfully curated and delivered fast.',
  };

  return (
    <div className="min-h-[60vh] bg-surface">
      <div className="container-page pb-12 sm:pb-16">
        <Seo title={meta.title} description={meta.description} />
        <ListingHeader
          eyebrow={meta.eyebrow}
          title={meta.title}
          description={meta.description}
          breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Shop', to: key ? '/shop' : undefined }, ...(key ? [{ label: meta.title }] : [])]}
        />
        <ProductListing />
      </div>
    </div>
  );
}
