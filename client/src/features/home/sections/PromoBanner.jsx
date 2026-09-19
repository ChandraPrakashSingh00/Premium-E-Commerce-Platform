import { ArrowRight, BadgeCheck } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { Button, SmartImage } from '@/components/ui';
import { PROMO } from '../content';

/** Wide dark "Best Sellers" banner. */
export function PromoBanner() {
  return (
    <section className="py-4 sm:py-6" aria-labelledby="promo-heading">
      <div className="container-page">
        <Reveal className="relative isolate grid grid-cols-1 overflow-hidden rounded-2xl bg-ink-900 text-white md:min-h-[300px] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] [&>*]:min-w-0">
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_90%_at_0%_0%,rgb(8_111_253/0.25),transparent_70%)]"
            aria-hidden="true"
          />
          <div className="relative z-10 order-2 flex flex-col justify-center px-6 pt-2 pb-8 sm:px-10 md:order-1 md:py-10 lg:px-14">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-300 uppercase">
              <BadgeCheck size={16} aria-hidden="true" />
              {PROMO.eyebrow}
            </p>
            <h2 id="promo-heading" className="mt-3 font-display text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {PROMO.title}
            </h2>
            <p className="mt-1 font-display text-lg font-medium text-white/85 sm:text-2xl">{PROMO.subtitle}</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">{PROMO.text}</p>
            <div className="mt-6">
              <Button to={PROMO.cta.to} rightIcon={<ArrowRight size={18} />} className="px-6">
                {PROMO.cta.label}
              </Button>
            </div>
          </div>
          <div className="relative order-1 h-56 sm:h-64 md:order-2 md:h-auto">
            <SmartImage
              src={PROMO.image.src}
              alt={PROMO.image.alt}
              width={1000}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="absolute! inset-0 bg-transparent!"
              imgClassName="mix-blend-lighten [mask-image:linear-gradient(to_bottom,black_70%,transparent)] md:[mask-image:linear-gradient(to_right,transparent,black_30%)]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default PromoBanner;
