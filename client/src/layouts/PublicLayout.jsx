import { useEffect } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { motion } from 'framer-motion';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import CartDrawer from '@/components/layout/CartDrawer';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import MobileMenu from '@/components/layout/MobileMenu';
import Navbar from '@/components/layout/Navbar';
import SearchOverlay from '@/components/layout/SearchOverlay';
import { useUiStore } from '@/store/uiStore';

export default function PublicLayout() {
  const { pathname } = useLocation();
  const close = useUiStore((s) => s.close);

  // Close any overlay on navigation.
  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-[100] rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <AnnouncementBar />
      <Navbar />
      <motion.main
        id="main"
        key={pathname}
        className="flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.main>
      <Footer />
      <MobileBottomNav />
      <SearchOverlay />
      <MobileMenu />
      <CartDrawer />
      <ScrollRestoration />
    </div>
  );
}
