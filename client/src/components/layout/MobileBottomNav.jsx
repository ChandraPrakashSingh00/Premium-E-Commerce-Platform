import { NavLink, useLocation } from 'react-router';
import { Heart, Home, LayoutGrid, Search, User } from 'lucide-react';
import { useWishlistIds } from '@/features/wishlist/useWishlist';
import { selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import { CountBadge } from './Logo';

const itemCls = (active) =>
  cn(
    'relative flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
    active ? 'text-brand-500' : 'text-ink-500 active:text-ink-900',
  );

/** Fixed bottom tab bar for phones/tablets. */
export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const openOverlay = useUiStore((s) => s.open);
  const overlay = useUiStore((s) => s.overlay);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const wishlistCount = useWishlistIds().size;

  // Checkout is a focused flow with its own fixed action bar.
  if (pathname.startsWith('/checkout')) return null;

  const tabs = [
    { to: '/', label: 'Home', icon: Home, active: pathname === '/' },
    { to: '/shop', label: 'Categories', icon: LayoutGrid, active: pathname.startsWith('/shop') || pathname.startsWith('/category') },
    { label: 'Search', icon: Search, onClick: () => openOverlay('search'), active: overlay === 'search' || pathname === '/search' },
    { to: '/wishlist', label: 'Wishlist', icon: Heart, active: pathname === '/wishlist', badge: wishlistCount },
    {
      to: isAuthenticated ? '/account' : '/login',
      label: 'Account',
      icon: User,
      active: pathname.startsWith('/account'),
    },
  ];

  return (
    <nav
      aria-label="Quick navigation"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white shadow-[0_-2px_12px_rgb(16_24_40/0.04)] lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg">
        {tabs.map(({ to, label, icon: Icon, active, onClick, badge }) => {
          const content = (
            <>
              <span className="relative">
                <Icon size={22} strokeWidth={active ? 2.1 : 1.75} aria-hidden="true" />
                <CountBadge count={badge} />
              </span>
              {label}
              {active && <span className="absolute top-0 h-[3px] w-8 rounded-b-full bg-brand-500" aria-hidden="true" />}
            </>
          );
          return (
            <li key={label} className="flex flex-1">
              {to ? (
                <NavLink to={to} className={itemCls(active)} aria-current={active ? 'page' : undefined}>
                  {content}
                </NavLink>
              ) : (
                <button type="button" onClick={onClick} className={itemCls(active)}>
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
