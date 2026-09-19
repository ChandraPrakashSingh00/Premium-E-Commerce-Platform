import { Seo } from '@/components/common/Seo';
import { ProductRail } from '@/components/product/ProductRail';
import { CategoriesSection } from '@/features/home/sections/CategoriesSection';
import { HeroSection } from '@/features/home/sections/HeroSection';
import { NewsletterSection } from '@/features/home/sections/NewsletterSection';
import { PromoBanner } from '@/features/home/sections/PromoBanner';
import { TestimonialsSection } from '@/features/home/sections/TestimonialsSection';
import { WhyChooseUs } from '@/features/home/sections/WhyChooseUs';
import { HERO } from '@/features/home/content';
import { useHomeProducts } from '@/features/products/hooks';
import { config } from '@/config/env';

export default function HomePage() {
  const home = useHomeProducts();
  const rail = (key) => ({
    items: home.data?.[key] ?? [],
    loading: home.isPending,
    error: home.isError ? home.error : null,
    onRetry: () => home.refetch(),
  });

  return (
    <>
      <Seo
        image={HERO.image.src}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: config.siteName,
          url: config.siteUrl,
          potentialAction: {
            '@type': 'SearchAction',
            target: `${config.siteUrl}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <HeroSection />
      <CategoriesSection />
      <ProductRail title="Trending Products" viewAllTo="/shop?sort=best-selling" {...rail('trending')} />
      <PromoBanner />
      <ProductRail title="New Arrivals" viewAllTo="/shop?newArrival=true" {...rail('newArrivals')} />
      <ProductRail title="Best Sellers" viewAllTo="/shop?bestSeller=true" className="pt-0 sm:pt-0" {...rail('bestSellers')} />
      <WhyChooseUs />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
