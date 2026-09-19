import { Gem, Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { WHY_US } from '../content';

const ICONS = { gem: Gem, shield: ShieldCheck, truck: Truck, returns: RotateCcw, support: Headphones };

export function WhyChooseUs() {
  return (
    <section className="py-8 sm:py-12" aria-labelledby="why-heading">
      <div className="container-page">
        <div className="rounded-2xl border border-line bg-white px-5 py-8 sm:px-8 sm:py-10">
          <h2 id="why-heading" className="text-center font-display text-xl font-semibold tracking-tight sm:text-2xl">
            Why Choose BlueMart?
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 [&>*]:min-w-0">
            {WHY_US.map((item, i) => {
              const Icon = ICONS[item.icon];
              return (
                <Reveal as="li" key={item.title} delay={i * 0.05} className={i === WHY_US.length - 1 ? 'col-span-2 text-center sm:col-span-1' : 'text-center'}>
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500" aria-hidden="true">
                    <Icon size={28} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold sm:text-base">{item.title}</h3>
                  <p className="mx-auto mt-1 max-w-[220px] text-xs leading-relaxed text-ink-500 sm:text-sm">{item.text}</p>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
