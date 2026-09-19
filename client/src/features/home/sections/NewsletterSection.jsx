import { Mail } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { SmartImage } from '@/components/ui';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { NEWSLETTER } from '../content';

export function NewsletterSection() {
  return (
    <section className="pt-4 pb-10 sm:pt-6 sm:pb-14" aria-labelledby="newsletter-heading">
      <div className="container-page">
        <Reveal className="relative isolate grid grid-cols-1 items-center gap-6 overflow-hidden rounded-2xl bg-brand-500 px-6 py-8 text-white sm:px-10 sm:py-10 md:grid-cols-[minmax(0,1fr)_220px] lg:grid-cols-[minmax(0,1fr)_300px] lg:px-14 [&>*]:min-w-0">
          <div
            className="pointer-events-none absolute -top-24 -left-24 -z-10 h-72 w-72 rounded-full border-[40px] border-white/5"
            aria-hidden="true"
          />
          <div>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15" aria-hidden="true">
              <Mail size={22} />
            </span>
            <h2 id="newsletter-heading" className="mt-4 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {NEWSLETTER.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">{NEWSLETTER.text}</p>
            <NewsletterForm tone="brand" id="home-newsletter" className="mt-6 max-w-xl" />
          </div>
          <div className="hidden justify-self-end md:block">
            <div className="h-52 w-52 overflow-hidden rounded-full border-8 border-white/20 lg:h-64 lg:w-64">
              <SmartImage src={NEWSLETTER.image.src} alt={NEWSLETTER.image.alt} width={600} sizes="260px" className="h-full w-full" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default NewsletterSection;
