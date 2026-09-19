import { Outlet } from 'react-router';
import { Breadcrumb } from '@/components/ui';
import { AccountSidebarNav, AccountTabsNav } from '@/features/account/components/AccountNav';
import { Avatar, VerifyEmailBanner } from '@/features/account/components/AccountBits';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/format';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

function ProfileHeader({ user, compact = false }) {
  const firstName = user?.name?.split(' ')[0] ?? 'there';
  return (
    <div className={compact ? 'flex items-center gap-3 border-b border-line p-4' : 'flex items-center gap-4'}>
      <Avatar name={user?.name} src={user?.avatar} size={compact ? 'sm' : 'md'} className={compact ? 'h-11 w-11' : undefined} />
      <div className="min-w-0">
        <p className="text-xs text-ink-500">{greeting()},</p>
        <p className={compact ? 'truncate text-sm font-semibold text-ink-900' : 'truncate font-display text-xl font-bold text-ink-900 sm:text-2xl'}>
          {compact ? user?.name : firstName}
        </p>
        {!compact && user?.createdAt && (
          <p className="text-xs text-ink-500">Member since {formatDate(user.createdAt, { month: 'long', year: 'numeric' })}</p>
        )}
        {compact && user?.email && <p className="truncate text-xs text-ink-500">{user.email}</p>}
      </div>
    </div>
  );
}

export default function AccountLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="bg-surface">
      <div className="container-page pt-4 pb-10 sm:pt-6 lg:pb-16">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'My Account' }]} />

        <div className="mt-3 rounded-2xl border border-line bg-white p-4 sm:p-5 lg:hidden">
          <ProfileHeader user={user} />
        </div>
        <div className="mt-3 lg:hidden">
          <AccountTabsNav />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 lg:mt-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 *:min-w-0">
          <aside className="hidden lg:block">
            <AccountSidebarNav header={<ProfileHeader user={user} compact />} />
          </aside>
          <div className="min-w-0">
            {user && !user.isEmailVerified && <VerifyEmailBanner email={user.email} className="mb-5" />}
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
