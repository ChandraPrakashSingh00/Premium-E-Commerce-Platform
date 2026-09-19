import { useState } from 'react';
import { ArrowRight, Check, Copy, Quote } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/product/ProductRail';
import { Button, Rating, SmartImage } from '@/components/ui';
import { toast } from '@/store/toastStore';
import { SPECIAL_OFFER, TESTIMONIALS } from '../content';

const AVATAR_TONES = ['bg-brand-500', 'bg-ink-900', 'bg-success-600'];

const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('');

function CouponChip({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied', `Apply ${code} in your cart.`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.info(`Your code is ${code}`);
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-white/60 px-3 font-mono text-sm font-bold tracking-[0.14em] text-white transition-colors hover:bg-white/10"
      aria-label={`Copy coupon code ${code}`}
    >
      {code}
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} className="text-white/70" aria-hidden="true" />}
    </button>
  );
}

function SpecialOfferCard() {
  const o = SPECIAL_OFFER;
  return (
    <Reveal className="relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl bg-brand-500 p-6 text-white sm:p-7">
      <p className="text-sm font-semibold text-white/85">{o.eyebrow}</p>
      <p className="mt-2 font-display text-[34px] leading-none font-extrabold tracking-tight sm:text-4xl">{o.title}</p>
      <p className="mt-2 font-display text-lg font-medium">{o.subtitle}</p>
      <div className="mt-4">
        <CouponChip code={o.code} />
      </div>
      <p className="mt-2 max-w-[60%] text-xs leading-relaxed text-white/75">{o.terms}</p>
      <div className="relative z-10 mt-auto pt-6">
        <Button to={o.cta.to} variant="light" className="px-6 text-brand-600!" rightIcon={<ArrowRight size={17} />}>
          {o.cta.label}
        </Button>
      </div>
      <div className="absolute -right-6 -bottom-6 h-44 w-44 overflow-hidden rounded-full border-[6px] border-white/20 sm:h-48 sm:w-48 lg:h-36 lg:w-36 xl:h-44 xl:w-44" aria-hidden="true">
        <SmartImage src={o.image.src} alt="" width={400} sizes="200px" className="h-full w-full bg-white" />
      </div>
    </Reveal>
  );
}

export function TestimonialsSection() {
  const reviews = TESTIMONIALS.slice(0, 3);
  return (
    <section className="py-8 sm:py-12" aria-labelledby="testimonials-heading">
      <div className="container-page">
        <SectionHeading id="testimonials-heading" title="What Our Customers Say" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:gap-5 [&>*]:min-w-0">
          <ul className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 sm:-mx-6 sm:gap-4 sm:scroll-px-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:gap-5">
            {reviews.map((t, i) => (
              <Reveal as="li" key={t.name} delay={i * 0.06} className="w-[84%] shrink-0 snap-start min-[480px]:w-[60%] md:w-auto">
                <figure className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 transition-shadow duration-300 hover:shadow-soft sm:p-6">
                  <figcaption className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${AVATAR_TONES[i % AVATAR_TONES.length]}`}
                      aria-hidden="true"
                    >
                      {initials(t.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">{t.name}</span>
                      <span className="block truncate text-xs text-ink-500">
                        {t.city} · Verified Buyer
                      </span>
                    </span>
                    <Quote size={24} className="ml-auto shrink-0 fill-brand-50 text-brand-100" aria-hidden="true" />
                  </figcaption>
                  <Rating value={t.rating} size={15} className="mt-4" />
                  <p className="mt-3 text-sm font-semibold text-ink-900">{t.title}</p>
                  <blockquote className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">“{t.text}”</blockquote>
                  <p className="mt-4 border-t border-line pt-3 text-xs font-medium text-ink-400">{t.product}</p>
                </figure>
              </Reveal>
            ))}
          </ul>
          <SpecialOfferCard />
        </div>
      </div>
    </section>
  );
}

export default TestimonialsSection;
