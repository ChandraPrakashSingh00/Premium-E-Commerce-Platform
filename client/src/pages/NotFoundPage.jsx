import { Link } from 'react-router';
import { ArrowRight, Search } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { Button, SmartImage } from '@/components/ui';
import { NOT_FOUND_IMAGE } from '@/features/home/content';
import { useUiStore } from '@/store/uiStore';

const QUICK_LINKS = [
  { to: '/shop', label: 'Shop all' },
  { to: '/shop?newArrival=true', label: 'New Arrivals' },
  { to: '/shop?bestSeller=true', label: 'Best Sellers' },
  { to: '/faq', label: 'Help & FAQs' },
];

export default function NotFoundPage() {
  const openOverlay = useUiStore((s) => s.open);
  return (
    <div className="bg-surface py-6 sm:py-12">
      <Seo title="Page not found" noindex />
      <div className="container-page">
        <div className="grid grid-cols-1 items-center gap-8 overflow-hidden rounded-2xl border border-line bg-white p-6 sm:p-10 lg:grid-cols-2 lg:gap-14 lg:p-14 [&>*]:min-w-0">
          <div>
            <p className="font-display text-6xl leading-none font-extrabold tracking-tight text-brand-500 sm:text-8xl">404</p>
            <h1 className="mt-4 font-display text-[28px] leading-tight font-bold tracking-tight sm:text-4xl">Oops! This page wandered off.</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500 sm:text-base">
              The link may be broken or the page may have moved. Let’s get you back to something you’ll love.
            </p>
            <div className="mt-7 flex flex-col gap-3 min-[400px]:flex-row">
              <Button to="/" rightIcon={<ArrowRight size={18} />}>
                Back to Home
              </Button>
              <Button variant="outline" leftIcon={<Search size={18} />} onClick={() => openOverlay('search')}>
                Search Products
              </Button>
            </div>
            <div className="mt-8 border-t border-line pt-5">
              <p className="text-sm font-semibold text-ink-900">Popular pages</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {QUICK_LINKS.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="inline-flex min-h-10 items-center rounded-lg border border-line px-3.5 text-sm text-ink-700 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <SmartImage
            src={NOT_FOUND_IMAGE}
            alt="A pair of sneakers resting on a neutral backdrop"
            width={1000}
            sizes="(min-width: 1024px) 45vw, 100vw"
            aspect="4 / 3"
            className="rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
