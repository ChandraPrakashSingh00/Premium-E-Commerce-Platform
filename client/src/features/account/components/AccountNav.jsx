import { Heart, LayoutGrid, LogOut, MapPin, Package, Settings, Star, User } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useLogout } from '@/features/auth/useSession';
import { cn } from '@/utils/cn';

const ACCOUNT_LINKS = [
  { to: '/account', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/reviews', label: 'My Reviews', icon: Star },
  { to: '/account/settings', label: 'Settings', icon: Settings },
];

/** Desktop sidebar navigation (white card, active = brand-50 + brand-600 with a blue bar). */
export function AccountSidebarNav({ header }) {
  const logout = useLogout();
  return (
    <nav aria-label="Account" className="sticky top-28 overflow-hidden rounded-2xl border border-line bg-white">
      {header}
      <ul className="space-y-0.5 p-2">
        {ACCOUNT_LINKS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex min-h-11 items-center gap-3 rounded-lg px-3.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 font-semibold text-brand-600 before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-brand-500'
                    : 'text-ink-600 hover:bg-surface hover:text-ink-900',
                )
              }
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="border-t border-line p-2">
        <button
          type="button"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3.5 text-sm font-medium text-danger-600 transition-colors hover:bg-danger-50 disabled:opacity-50"
        >
          <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
          {logout.isPending ? 'Signing out…' : 'Logout'}
        </button>
      </div>
    </nav>
  );
}

/** Mobile / tablet horizontally scrolling pill nav (active = solid blue pill). */
export function AccountTabsNav() {
  const listRef = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => {
    const list = listRef.current;
    const active = list?.querySelector('[aria-current="page"]');
    if (list && active) list.scrollLeft = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
  }, [pathname]);
  return (
    <nav aria-label="Account" className="-mx-4 sm:-mx-6">
      <ul ref={listRef} className="scrollbar-none relative flex gap-2 overflow-x-auto px-4 py-1 sm:px-6">
        {ACCOUNT_LINKS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="shrink-0">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
                  isActive ? 'border-brand-500 bg-brand-500 text-white' : 'border-line bg-white text-ink-600 hover:border-brand-300 hover:text-brand-600',
                )
              }
            >
              <Icon size={15} strokeWidth={2} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
