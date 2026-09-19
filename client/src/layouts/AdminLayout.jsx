import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Drawer } from '@/components/ui';
import { AdminBrand, AdminNav, AdminNavFooter, AdminSidebar } from '@/features/admin/components/layout/AdminSidebar';
import { CommandPalette } from '@/features/admin/components/layout/CommandPalette';
import { TopBar } from '@/features/admin/components/layout/TopBar';

// Restyles the shared (white) Drawer chrome for the dark ink navigation panel.
const DARK_DRAWER =
  'bg-ink-900 max-w-72 [&>div:first-child]:border-white/10 [&_button[aria-label=Close]]:text-white/70 [&_button[aria-label=Close]:hover]:bg-white/10 [&_button[aria-label=Close]:hover]:text-white';

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Close the mobile drawer on navigation.
  useEffect(() => setNavOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-dvh bg-surface">
      {/* Page titles come from PageHeader (<Seo noindex>); this keeps the whole console out of indexes even while a page loads. */}
      <meta name="robots" content="noindex, nofollow" />
      <a href="#admin-main" className="sr-only z-90 rounded-lg bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <AdminSidebar />

      <Drawer open={navOpen} onClose={() => setNavOpen(false)} side="left" title={<AdminBrand />} className={DARK_DRAWER}>
        <div className="flex min-h-full flex-col">
          <div className="flex-1">
            <AdminNav onNavigate={() => setNavOpen(false)} />
          </div>
          <AdminNavFooter />
        </div>
      </Drawer>

      <div className="lg:pl-64">
        <TopBar pathname={pathname} onOpenNav={() => setNavOpen(true)} onOpenSearch={() => setPaletteOpen(true)} />

        <main id="admin-main" tabIndex={-1} className="mx-auto w-full max-w-[1600px] px-4 py-6 focus:outline-none sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
