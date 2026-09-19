import { Heart, LayoutDashboard, LogIn, LogOut, Package, User, UserPlus } from 'lucide-react';
import { Dropdown } from '@/components/ui';
import { useLogout } from '@/features/auth/useSession';
import { selectIsAdmin, selectIsAuthenticated, useAuthStore } from '@/store/authStore';

/** Account icon + dropdown (desktop navbar). */
export function AccountMenu() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isAdmin = useAuthStore(selectIsAdmin);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const items = isAuthenticated
    ? [
        { label: 'My account', to: '/account', icon: <User size={16} /> },
        { label: 'Orders', to: '/account/orders', icon: <Package size={16} /> },
        { label: 'Wishlist', to: '/wishlist', icon: <Heart size={16} /> },
        ...(isAdmin ? [{ label: 'Admin dashboard', to: '/admin', icon: <LayoutDashboard size={16} /> }] : []),
        { divider: true },
        { label: 'Sign out', icon: <LogOut size={16} />, danger: true, onClick: () => logout.mutate() },
      ]
    : [
        { label: 'Sign in', to: '/login', icon: <LogIn size={16} /> },
        { label: 'Create account', to: '/register', icon: <UserPlus size={16} /> },
      ];

  const initial = user?.name?.trim()?.[0]?.toUpperCase();

  return (
    <Dropdown
      label={isAuthenticated ? `Account menu for ${user?.name ?? 'you'}` : 'Account menu'}
      items={items}
      trigger={
        <span className="flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900">
          {isAuthenticated && initial ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">{initial}</span>
          ) : (
            <User size={20} strokeWidth={1.75} />
          )}
        </span>
      }
    />
  );
}

export default AccountMenu;
