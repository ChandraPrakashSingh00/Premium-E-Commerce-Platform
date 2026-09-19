import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronDown, ChevronRight, ExternalLink, LogOut, Menu, Search, Settings, Store } from 'lucide-react';
import { Link } from 'react-router';
import { Dropdown, IconButton } from '@/components/ui';
import { CountBadge } from '@/components/layout/Logo';
import { useLogout } from '@/features/auth/useSession';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';
import { dashboardApi } from '../../api/dashboard';
import { adminKey } from '../../hooks/shared';
import { crumbsFor } from './nav';

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || 'A';

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  return (
    <Dropdown
      label="Account menu"
      trigger={
        <span className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors hover:bg-surface">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white" aria-hidden="true">
            {initials(user?.name)}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-35 truncate text-sm font-semibold text-ink-900">Admin</span>
            <span className="block max-w-35 truncate text-xs text-ink-500">{user?.name}</span>
          </span>
          <ChevronDown size={16} className="hidden text-ink-500 sm:block" aria-hidden="true" />
        </span>
      }
      items={[
        { label: 'Store settings', icon: <Settings size={16} />, to: '/admin/settings' },
        { label: 'View storefront', icon: <Store size={16} />, to: '/' },
        { divider: true },
        { label: logout.isPending ? 'Signing out…' : 'Sign out', icon: <LogOut size={16} />, danger: true, onClick: () => logout.mutate() },
      ]}
    />
  );
}

/**
 * Bell linking to the pending-orders queue. The count is read from the dashboard
 * cache only (never triggers its own request).
 */
function NotificationBell() {
  const { data } = useQuery({ queryKey: adminKey('dashboard', '30d'), queryFn: () => dashboardApi.dashboard('30d'), enabled: false });
  const pending = data?.cards?.pendingOrders?.value ?? 0;
  return (
    <Link
      to="/admin/orders?status=pending"
      aria-label={pending ? `Notifications: ${pending} pending orders` : 'Notifications: pending orders'}
      title="Pending orders"
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-600 transition-colors hover:bg-surface hover:text-ink-900"
    >
      <Bell size={20} strokeWidth={1.75} aria-hidden="true" />
      <CountBadge count={pending} />
    </Link>
  );
}

function Breadcrumbs({ pathname }) {
  const crumbs = crumbsFor(pathname);
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5">
        {crumbs.map((c, i) => (
          <li key={c.label} className={cn('min-w-0 items-center gap-1.5', c.to ? 'hidden sm:flex' : 'flex')}>
            {i > 0 && <ChevronRight size={14} className="shrink-0 text-ink-300" aria-hidden="true" />}
            {c.to ? (
              <Link to={c.to} className="truncate text-sm text-ink-500 hover:text-brand-600">
                {c.label}
              </Link>
            ) : (
              <span className="truncate font-display text-base font-semibold text-ink-900 lg:font-sans lg:text-sm lg:font-medium lg:text-ink-700" aria-current="page">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** White admin top bar: menu (mobile), title/breadcrumb, search (opens the Ctrl+K palette), bell, store link, account. */
export function TopBar({ pathname, onOpenNav, onOpenSearch }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-line bg-white px-4 sm:gap-3 sm:px-6 lg:px-8">
      <IconButton label="Open navigation" className="-ml-2 lg:hidden" onClick={onOpenNav}>
        <Menu size={20} />
      </IconButton>
      <div className="min-w-0 flex-1 lg:flex-none lg:basis-56 xl:basis-64">
        <Breadcrumbs pathname={pathname} />
      </div>
      <div className="hidden min-w-0 flex-1 md:block">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-10 w-full max-w-md items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 text-sm text-ink-400 transition-colors hover:border-ink-300 focus-visible:border-brand-500"
          aria-label="Search products, orders (Ctrl K)"
        >
          <Search size={17} className="shrink-0 text-ink-500" aria-hidden="true" />
          <span className="flex-1 truncate text-left">Search products, orders…</span>
          <kbd className="hidden rounded-md border border-line bg-white px-1.5 py-0.5 font-sans text-[11px] font-medium text-ink-500 lg:inline">Ctrl K</kbd>
        </button>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <IconButton label="Search" className="text-ink-600 md:hidden" onClick={onOpenSearch}>
          <Search size={20} strokeWidth={1.75} />
        </IconButton>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-ink-600 transition-colors hover:bg-surface hover:text-brand-600 xl:inline-flex"
        >
          View store <ExternalLink size={14} aria-hidden="true" />
        </a>
        <NotificationBell />
        <span className="mx-1 hidden h-7 w-px bg-line sm:block" aria-hidden="true" />
        <UserMenu />
      </div>
    </header>
  );
}
