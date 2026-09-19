import { NavLink, useLocation } from 'react-router';
import { ChevronDown, Headphones, LayoutGrid } from 'lucide-react';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { cn } from '@/utils/cn';

const LINKS = [
  { to: '/shop?newArrival=true', label: 'New Arrivals', match: (p) => p.get('newArrival') === 'true' },
  { to: '/shop?bestSeller=true', label: 'Best Sellers', match: (p) => p.get('bestSeller') === 'true' },
  { to: '/shop?discount=20&sort=discount', label: 'Offers', match: (p) => Boolean(p.get('discount')) },
];

const linkCls = (active) =>
  cn(
    'relative flex h-11 items-center gap-1.5 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand-500 after:transition-transform',
    active ? 'text-brand-600 after:scale-x-100' : 'text-ink-700 after:scale-x-0 hover:text-brand-600',
  );

/** Second header row (desktop): primary links + categories mega-menu trigger. */
export function DesktopNav({ megaOpen, megaId, onToggleMega, onHoverOpen, onHoverClose }) {
  const { pathname, search } = useLocation();
  const { settings } = useStoreSettings();
  const params = new URLSearchParams(search);
  const onShop = pathname === '/shop';
  const shopActive = onShop && !LINKS.some((l) => l.match(params));

  return (
    <div className="hidden border-t border-line lg:block">
      <div className="container-page flex h-11 items-center justify-between gap-6">
        <ul className="flex items-center gap-8">
          <li onMouseEnter={onHoverOpen} onMouseLeave={onHoverClose}>
            <button
              type="button"
              aria-expanded={megaOpen}
              aria-controls={megaId}
              onClick={onToggleMega}
              className={cn(linkCls(megaOpen || pathname.startsWith('/category')), 'font-semibold')}
            >
              <LayoutGrid size={16} aria-hidden="true" />
              Categories
              <ChevronDown size={14} className={cn('transition-transform', megaOpen && 'rotate-180')} aria-hidden="true" />
            </button>
          </li>
          <li>
            <NavLink to="/shop" className={() => linkCls(shopActive)}>
              Shop
            </NavLink>
          </li>
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className={() => linkCls(onShop && l.match(params))}>
                {l.label}
                {l.label === 'Offers' && (
                  <span className="rounded-full bg-danger-50 px-1.5 py-px text-[10px] font-bold text-danger-600 uppercase">Hot</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
        {settings.supportPhone && (
          <a
            href={`tel:${settings.supportPhone.replace(/\s/g, '')}`}
            className="flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-brand-600"
          >
            <Headphones size={16} className="text-brand-500" aria-hidden="true" />
            <span>
              Need help? <span className="font-semibold text-ink-900">{settings.supportPhone}</span>
            </span>
          </a>
        )}
      </div>
    </div>
  );
}

export default DesktopNav;
