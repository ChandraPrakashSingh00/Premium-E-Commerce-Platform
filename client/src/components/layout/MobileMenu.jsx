import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronDown, ChevronRight, Heart, LayoutDashboard, LogOut, Package, User } from 'lucide-react';
import { Button, Drawer, Skeleton } from '@/components/ui';
import { useLogout } from '@/features/auth/useSession';
import { useCategories } from '@/features/categories/hooks';
import { selectIsAdmin, selectIsAuthenticated, useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

const rowCls = 'flex min-h-12 w-full items-center justify-between gap-3 text-[15px] font-medium text-ink-900 hover:text-brand-600';

function CategoryAccordion() {
  const { data: categories = [], isPending } = useCategories();
  const [openId, setOpenId] = useState(null);

  if (isPending) {
    return (
      <div className="space-y-3 py-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-40" />
        ))}
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {categories.map((cat) => {
        const open = openId === cat._id;
        const hasChildren = cat.children?.length > 0;
        return (
          <li key={cat._id}>
            {hasChildren ? (
              <>
                <button type="button" className={rowCls} aria-expanded={open} onClick={() => setOpenId(open ? null : cat._id)}>
                  {cat.name}
                  <ChevronDown size={18} className={cn('text-ink-400 transition-transform', open && 'rotate-180')} aria-hidden="true" />
                </button>
                {open && (
                  <ul className="mb-3 ml-1 border-l-2 border-brand-100 pl-4">
                    <li>
                      <Link to={`/category/${cat.slug}`} className="flex min-h-11 items-center text-sm font-semibold text-brand-600">
                        Shop all {cat.name}
                      </Link>
                    </li>
                    {cat.children.map((child) => (
                      <li key={child._id}>
                        <Link to={`/category/${child.slug}`} className="flex min-h-11 items-center text-sm text-ink-600 hover:text-brand-600">
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <Link to={`/category/${cat.slug}`} className={rowCls}>
                {cat.name}
                <ChevronRight size={18} className="text-ink-400" aria-hidden="true" />
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function MobileMenu() {
  const open = useUiStore((s) => s.overlay === 'menu');
  const close = useUiStore((s) => s.close);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isAdmin = useAuthStore(selectIsAdmin);
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const accountLinks = [
    { to: '/account', label: 'My account', icon: User },
    { to: '/account/orders', label: 'Orders', icon: Package },
    { to: '/wishlist', label: 'Wishlist', icon: Heart },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin dashboard', icon: LayoutDashboard }] : []),
  ];

  return (
    <Drawer
      open={open}
      onClose={close}
      side="left"
      title="Menu"
      footer={
        isAuthenticated ? (
          <button type="button" onClick={() => logout.mutate()} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-danger-600">
            <LogOut size={16} /> Sign out
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button to="/login">Sign in</Button>
            <Button to="/register" variant="outline">
              Create account
            </Button>
          </div>
        )
      }
    >
      {/* Links that only change the query string don't trigger the layout's pathname-based close. */}
      <nav aria-label="Mobile" className="px-5 py-4" onClick={(e) => e.target instanceof Element && e.target.closest('a') && close()}>
        {isAuthenticated && (
          <p className="mb-3 rounded-lg bg-brand-50 px-3 py-2.5 text-sm text-brand-700">
            Hello, <span className="font-semibold">{user?.name?.split(' ')[0]}</span>
          </p>
        )}
        <ul className="divide-y divide-line border-b border-line">
          {[
            { to: '/shop', label: 'Shop all' },
            { to: '/shop?newArrival=true', label: 'New Arrivals' },
            { to: '/shop?bestSeller=true', label: 'Best Sellers' },
            { to: '/shop?discount=20&sort=discount', label: 'Offers' },
          ].map((l) => (
            <li key={l.to}>
              <Link to={l.to} className={cn(rowCls, 'font-display font-semibold')}>
                {l.label}
                <ChevronRight size={18} className="text-ink-300" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 mb-1 text-xs font-semibold tracking-wide text-ink-400 uppercase">Categories</p>
        <CategoryAccordion />

        {isAuthenticated && (
          <>
            <p className="mt-6 mb-1 text-xs font-semibold tracking-wide text-ink-400 uppercase">Account</p>
            <ul>
              {accountLinks.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link to={to} className="flex min-h-12 items-center gap-3 text-[15px] text-ink-800">
                    <Icon size={18} className="text-brand-500" /> {label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-6 mb-1 text-xs font-semibold tracking-wide text-ink-400 uppercase">Help</p>
        <ul className="grid grid-cols-2">
          {[
            { to: '/contact', label: 'Contact us' },
            { to: '/faq', label: 'FAQ' },
            { to: '/shipping-policy', label: 'Shipping' },
            { to: '/refund-policy', label: 'Returns' },
          ].map((l) => (
            <li key={l.to}>
              <Link to={l.to} className="flex min-h-11 items-center text-sm text-ink-600 hover:text-brand-600">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Drawer>
  );
}
