import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { Seo } from '@/components/common/Seo';
import { Breadcrumb, Button, SmartImage } from '@/components/ui';
import { ABOUT_IMAGES } from '@/features/home/content';
import { WhyChooseUs } from '@/features/home/sections/WhyChooseUs';

const VALUES = [
  { title: 'Curated, not endless', text: 'Our buyers review thousands of products each season and keep only the ones we would use ourselves.' },
  { title: 'Honest pricing', text: 'Clear prices with taxes shown before you pay. No inflated “original” prices, no hidden fees.' },
  { title: 'Built for India', text: 'UPI-first checkout, cash on delivery, and a delivery network that reaches 19,000+ pin codes.' },
];

const STATS = [
  { value: '2019', label: 'Founded in Bengaluru' },
  { value: '350+', label: 'Partner brands' },
  { value: '19K+', label: 'Pin codes served' },
  { value: '4.8★', label: 'Average customer rating' },
];

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About us"
        description="BlueMart curates fashion, tech, beauty and home essentials from brands we trust — delivered fast across India."
        image={ABOUT_IMAGES.hero}
      />
      <div className="container-page pt-6">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'About' }]} />
        <header className="grid grid-cols-1 gap-6 py-8 sm:gap-10 sm:py-12 lg:grid-cols-2 lg:items-end lg:gap-16 [&>*]:min-w-0">
          <div>
            <p className="eyebrow">Our story</p>
            <h1 className="heading-xl mt-4">Fewer, better things — delivered with care.</h1>
          </div>
          <p className="text-base leading-relaxed text-ink-500 sm:text-lg">
            BlueMart started with a simple frustration: shopping online meant scrolling through endless lookalikes. We set out to build a store that does the
            hard work for you — hand-picking well-made products, pricing them honestly and delivering them quickly, anywhere in India.
          </p>
        </header>
        <Reveal>
          <SmartImage
            src={ABOUT_IMAGES.hero}
            alt="Inside a bright, minimal clothing store"
            width={1600}
            sizes="100vw"
            priority
            className="aspect-[16/9] rounded-2xl sm:aspect-[21/9]"
          />
        </Reveal>
        <dl className="mt-6 grid grid-cols-2 gap-6 rounded-2xl border border-line bg-white p-6 sm:p-8 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col">
              <dt className="order-2 mt-1 text-sm text-ink-500">{s.label}</dt>
              <dd className="font-display text-3xl font-bold tracking-tight text-brand-500 sm:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>
        <section className="section grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center lg:gap-20 [&>*]:min-w-0" aria-labelledby="values-heading">
          <Reveal>
            <SmartImage
              src={ABOUT_IMAGES.studio}
              alt="Designer working on garments in a studio"
              width={1000}
              sizes="(min-width: 1024px) 45vw, 100vw"
              aspect="4 / 5"
              className="rounded-2xl"
            />
          </Reveal>
          <div>
            <p className="eyebrow">What we stand for</p>
            <h2 id="values-heading" className="heading-lg mt-3">
              Quality you can feel. Service you can count on.
            </h2>
            <ul className="mt-10 space-y-8">
              {VALUES.map((v, i) => (
                <li key={v.title} className="flex gap-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 font-display text-sm font-semibold text-brand-500">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold">{v.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{v.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button to="/shop" className="mt-10 px-6" rightIcon={<ArrowRight size={18} />}>
              Explore the collection
            </Button>
          </div>
        </section>
      </div>
      <WhyChooseUs />
      <div className="h-6" />
    </>
  );
}
