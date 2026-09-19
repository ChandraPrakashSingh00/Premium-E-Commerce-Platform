import { ExternalLink, LogOut } from 'lucide-react';
import { NavLink } from 'react-router';
import { Logo } from '@/components/layout/Logo';
import { useLogout } from '@/features/auth/useSession';
import { cn } from '@/utils/cn';
import { NAV_GROUPS } from './nav';

export function AdminBrand({ className, tone = 'light' }) {
  return <Logo tone={tone} subtitle="Admin" to="/admin" size="sm" className={cn('rounded-lg', className)} />;
}

const itemBase =
  'group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400';

/** Sidebar navigation on the dark ink panel (desktop column and mobile drawer body). */
export function AdminNav({ onNavigate }) {
  return (
    <nav aria-label="Admin" className="flex flex-col gap-5 px-3 py-4">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-white/40 uppercase">{group.label}</p>
          <ul className="space-y-1">
            {group.items.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(itemBase, isActive ? 'bg-brand-500 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white')
                  }
                >
                  <Icon size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Store link + logout pinned to the bottom of the dark panel. */
export function AdminNavFooter() {
  const logout = useLogout();
  return (
    <div className="space-y-1 border-t border-white/10 p-3">
      <a href="/" target="_blank" rel="noopener noreferrer" className={cn(itemBase, 'text-white/70 hover:bg-white/10 hover:text-white')}>
        <ExternalLink size={18} strokeWidth={1.75} aria-hidden="true" />
        View store
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
      <button
        type="button"
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        className={cn(itemBase, 'w-full text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-60')}
      >
        <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
        {logout.isPending ? 'Signing out…' : 'Logout'}
      </button>
    </div>
  );
}

/** Dark panel content, shared by the fixed desktop column and the mobile drawer. */
export function AdminSidebarPanel({ onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-5">
        <AdminBrand />
      </div>
      <div className="scrollbar-none flex-1 overflow-y-auto">
        <AdminNav onNavigate={onNavigate} />
      </div>
      <AdminNavFooter />
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block" aria-label="Admin sidebar">
      <AdminSidebarPanel />
    </aside>
  );
}
