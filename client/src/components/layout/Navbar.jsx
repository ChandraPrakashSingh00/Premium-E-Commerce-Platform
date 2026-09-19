import { useEffect, useId, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Heart, Menu, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '@/features/cart/useCart';
import NotificationBell from '@/features/notifications/NotificationBell';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { useEscapeKey, useOnClickOutside } from '@/hooks';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import { AccountMenu } from './AccountMenu';
import { DesktopNav } from './DesktopNav';
import { HeaderSearchField, MobileSearchBar } from './HeaderSearch';
import { CountBadge, Logo } from './Logo';
import { MegaMenu } from './MegaMenu';

const iconBtn =
  'relative h-11 w-11 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-surface hover:text-brand-600';

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);
  return scrolled;
}

/** Opens search with ⌘K / Ctrl+K or "/" (outside of inputs). */
function useSearchShortcut(openSearch) {
  useEffect(() => {
    const onKey = (e) => {
      const target = e.target;
      const typing = target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        openSearch();
      } else if (e.key === '/' && !typing) {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openSearch]);
}

export default function Navbar() {
  const scrolled = useScrolled();
  const { pathname, search } = useLocation();
  const openOverlay = useUiStore((s) => s.open);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { itemCount } = useCart();
  const wishlistCount = useWishlistIds().size;
  const [megaOpen, setMegaOpen] = useState(false);
  const megaId = useId();
  const headerRef = useRef(null);
  const hoverTimer = useRef(null);

  const openSearch = () => openOverlay('search');
  useSearchShortcut(openSearch);

  const closeMega = () => setMegaOpen(false);
  useEffect(() => {
    setMegaOpen(false);
  }, [pathname, search]);
  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  useEscapeKey(closeMega, megaOpen);
  useOnClickOutside(headerRef, closeMega, megaOpen);

  const hoverOpen = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setMegaOpen(true), 80);
  };
  const hoverClose = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setMegaOpen(false), 160);
  };

  return (
    <>
      <header
        ref={headerRef}
        className={cn('sticky top-0 z-40 border-b border-line bg-white transition-shadow duration-300', (scrolled || megaOpen) && 'shadow-soft')}
      >
        <nav className="container-page flex h-16 items-center gap-1 lg:h-18 lg:gap-8" aria-label="Main">
          <button type="button" className={cn(iconBtn, '-ml-3 flex lg:hidden')} onClick={() => openOverlay('menu')} aria-label="Open menu">
            <Menu size={22} strokeWidth={1.75} />
          </button>
          <div className="min-[400px]:hidden">
            <Logo size="sm" />
          </div>
          <div className="hidden min-[400px]:block">
            <Logo />
          </div>

          <div className="mx-auto hidden w-full max-w-2xl min-w-0 lg:block">
            <HeaderSearchField />
          </div>

          {/* Actions — rendered once for every breakpoint so the bell only mounts one instance. */}
          <div className="ml-auto flex shrink-0 items-center gap-0 sm:gap-1 lg:ml-0">
            <button
              type="button"
              className={cn(iconBtn, isAuthenticated ? 'hidden min-[360px]:flex lg:hidden' : 'flex lg:hidden')}
              onClick={openSearch}
              aria-label="Search"
            >
              <Search size={21} strokeWidth={1.75} />
            </button>
            {isAuthenticated && <NotificationBell />}
            {/* On the narrowest phones the wishlist lives in the bottom navigation only. */}
            <NavLink
              to="/wishlist"
              className={cn(iconBtn, 'hidden min-[360px]:flex')}
              aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}`}
            >
              <Heart size={21} strokeWidth={1.75} />
              <CountBadge count={wishlistCount} />
            </NavLink>
            <div className="hidden lg:block">
              <AccountMenu />
            </div>
            <button
              type="button"
              className={cn(iconBtn, '-mr-3 flex lg:mr-0')}
              onClick={() => openOverlay('cart')}
              aria-label={`Cart, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
            >
              <ShoppingCart size={21} strokeWidth={1.75} />
              <CountBadge count={itemCount} />
            </button>
          </div>
        </nav>

        <DesktopNav
          megaOpen={megaOpen}
          megaId={megaId}
          onToggleMega={() => setMegaOpen((v) => !v)}
          onHoverOpen={hoverOpen}
          onHoverClose={hoverClose}
        />
        <MegaMenu open={megaOpen} onClose={closeMega} id={megaId} onMouseEnter={hoverOpen} onMouseLeave={hoverClose} />
      </header>
      <MobileSearchBar />
    </>
  );
}
