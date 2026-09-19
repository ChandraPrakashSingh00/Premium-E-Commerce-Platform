import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, SmartImage } from '@/components/ui';
import { cn } from '@/utils/cn';
import { HERO, HERO_SLIDES } from '../content';

const INTERVAL = 6500;
const ease = [0.22, 1, 0.36, 1];

function Slide({ slide, index, total }) {
  const first = index === 0;
  return (
    <motion.div
      key={slide.id}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease }}
      className="grid h-full grid-cols-1 items-center lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] [&>*]:min-w-0"
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.05, ease }}
        className="relative z-10 order-2 px-5 pt-1 pb-14 sm:px-10 lg:order-1 lg:py-12 lg:pl-14 xl:pl-16"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-brand-300 uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-hidden="true" />
          {slide.eyebrow}
        </p>
        <h2 className="mt-4 font-display text-[32px] leading-[1.08] font-bold tracking-tight text-white sm:text-5xl xl:text-[56px]">{slide.title}</h2>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-lg">{slide.text}</p>
        <div className="mt-6 flex flex-col gap-3 min-[400px]:flex-row sm:mt-8">
          <Button to={slide.primary.to} rightIcon={<ArrowRight size={18} />} className="px-6">
            {slide.primary.label}
          </Button>
          <Button to={slide.secondary.to} variant="outlineLight" className="px-6">
            {slide.secondary.label}
          </Button>
        </div>
      </motion.div>

      <div className="relative order-1 h-52 min-[400px]:h-60 sm:h-72 lg:order-2 lg:h-full">
        <SmartImage
          src={slide.image.src}
          alt={slide.image.alt}
          width={1100}
          sizes="(min-width: 1024px) 48vw, 100vw"
          priority={first}
          className="absolute! inset-0 bg-transparent!"
          imgClassName="mix-blend-lighten [mask-image:linear-gradient(to_bottom,black_70%,transparent)] lg:[mask-image:linear-gradient(to_right,transparent,black_35%)]"
        />
        <div className="absolute top-4 right-4 hidden rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-md sm:block lg:top-8 lg:right-8">
          <p className="text-[11px] font-medium tracking-wide text-white/60 uppercase">{slide.tag.label}</p>
          <p className="mt-0.5 font-display text-base font-semibold text-white">{slide.tag.value}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const total = HERO_SLIDES.length;

  const go = useCallback((next) => setIndex((next + total) % total), [total]);

  useEffect(() => {
    if (paused || reduceMotion || total < 2) return undefined;
    const t = setTimeout(() => go(index + 1), INTERVAL);
    return () => clearTimeout(t);
  }, [index, paused, reduceMotion, total, go]);

  const arrow =
    'flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition-colors hover:bg-white hover:text-ink-900';

  return (
    <section className="pt-3 pb-4 sm:pt-5 sm:pb-6" aria-labelledby="hero-heading">
      <h1 id="hero-heading" className="sr-only">
        BlueMart — {HERO.title}
      </h1>
      <div className="container-page">
        <div
          aria-roledescription="carousel"
          aria-label="Featured offers"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          className="relative isolate min-h-[500px] overflow-hidden rounded-2xl bg-ink-900 min-[400px]:min-h-[520px] sm:min-h-[600px] lg:h-[460px] lg:min-h-0 xl:h-[500px]"
        >
          {/* Subtle blue glow at the edges */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_0%_100%,rgb(8_111_253/0.28),transparent_70%),radial-gradient(40%_60%_at_100%_0%,rgb(8_111_253/0.18),transparent_70%)]"
            aria-hidden="true"
          />
          <AnimatePresence mode="wait" initial={false}>
            <Slide key={HERO_SLIDES[index].id} slide={HERO_SLIDES[index]} index={index} total={total} />
          </AnimatePresence>

          {total > 1 && (
            <>
              <div className="absolute right-6 bottom-6 z-20 hidden gap-2 lg:right-8 lg:bottom-8 lg:flex">
                <button type="button" className={arrow} onClick={() => go(index - 1)} aria-label="Previous slide">
                  <ChevronLeft size={20} />
                </button>
                <button type="button" className={arrow} onClick={() => go(index + 1)} aria-label="Next slide">
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="absolute inset-x-0 bottom-3 z-20 flex justify-center gap-1 lg:bottom-9">
                {HERO_SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index ? 'true' : undefined}
                    className="group flex h-8 items-center px-1"
                  >
                    <span
                      className={cn(
                        'block h-2 rounded-full transition-all duration-300',
                        i === index ? 'w-7 bg-brand-500' : 'w-2 bg-white/35 group-hover:bg-white/60',
                      )}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
