import { motion } from 'framer-motion';
import { ArrowLeft, Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { Logo } from '@/components/layout/Logo';

const PERKS = [
  { icon: Truck, title: 'Free Shipping', text: 'On orders above ₹999' },
  { icon: ShieldCheck, title: 'Secure Payments', text: '100% protected checkout' },
  { icon: RotateCcw, title: 'Easy Returns', text: 'Within 7 days' },
  { icon: Headphones, title: '24/7 Support', text: 'We’re here to help' },
];

function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-ink-900 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12" aria-hidden="true">
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-brand-500/15 blur-3xl" />
      <Logo tone="light" tagline to={null} />
      <div className="relative">
        <p className="text-xs font-semibold tracking-[0.18em] text-brand-300 uppercase">Your Style. Our Priority.</p>
        <h2 className="mt-3 font-display text-3xl leading-tight font-bold text-white xl:text-4xl">
          Everything You Love.
          <br />
          <span className="text-brand-400">Delivered Better.</span>
        </h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/60">Premium products, better prices and faster delivery — all in one place.</p>
        <ul className="mt-8 grid grid-cols-2 gap-4">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-brand-300">
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{title}</span>
                <span className="block text-xs text-white/50">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="relative text-xs text-white/40">Trusted by thousands of shoppers across India.</p>
    </aside>
  );
}

export default function AuthLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2 sm:px-8">
        <Logo size="lg" tagline className="min-w-0" />
        <Link
          to="/"
          className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-500 hover:text-brand-600"
          aria-label="Back to store"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span className="hidden min-[420px]:inline">Back to store</span>
        </Link>
      </header>

      <main id="main" className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:px-8 sm:py-10">
        <div className="grid w-full max-w-md grid-cols-1 overflow-hidden rounded-2xl border border-line bg-white lg:max-w-5xl lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] *:min-w-0">
          <BrandPanel />
          <motion.div
            key={pathname}
            className="px-5 py-7 sm:px-10 sm:py-10 xl:px-14"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      <footer className="safe-bottom px-4 pb-6 text-center text-xs text-ink-400 sm:px-8">© {new Date().getFullYear()} BlueMart. All rights reserved.</footer>
      <ScrollRestoration />
    </div>
  );
}
