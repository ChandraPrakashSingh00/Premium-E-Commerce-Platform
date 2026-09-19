import { config } from '@/config/env';

const AVAILABILITY = {
  in: 'https://schema.org/InStock',
  out: 'https://schema.org/OutOfStock',
};

/** schema.org Product + BreadcrumbList for a ProductDetail. */
export function productJsonLd(product) {
  const url = `${config.siteUrl}/product/${product.slug}`;
  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: (product.images ?? []).map((i) => i.url).filter(Boolean),
    description: product.seo?.description || product.shortDescription || product.description?.slice(0, 300) || product.name,
    sku: product.sku,
    ...(product.brand?.name && { brand: { '@type': 'Brand', name: product.brand.name } }),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: product.price,
      availability: product.inStock ? AVAILABILITY.in : AVAILABILITY.out,
      itemCondition: 'https://schema.org/NewCondition',
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(product.ratingAverage).toFixed(1),
        reviewCount: product.reviewCount,
      },
    }),
  };

  const crumbs = [
    { name: 'Home', url: `${config.siteUrl}/` },
    ...(product.breadcrumbs ?? []).map((b) => ({ name: b.name, url: `${config.siteUrl}/category/${b.slug}` })),
    { name: product.name, url },
  ];
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
  };

  return [productLd, breadcrumbLd];
}
