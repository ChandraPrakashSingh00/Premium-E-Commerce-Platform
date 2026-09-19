import { useLocation } from 'react-router';
import { Search } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

const PLACEHOLDER = 'Search for products, brands and more';

/**
 * Search "field" that opens the search overlay (the overlay owns the real input + suggestions).
 * Rendered as one button: grey field + blue square search button on its right end.
 */
export function HeaderSearchField({ className, compact = false }) {
  const openOverlay = useUiStore((s) => s.open);
  return (
    <button
      type="button"
      onClick={() => openOverlay('search')}
      aria-label="Search products (Ctrl+K)"
      aria-keyshortcuts="Control+K Meta+K /"
      className={cn(
        'group flex h-11 w-full min-w-0 items-center overflow-hidden rounded-lg border border-line bg-surface text-left transition-colors hover:border-brand-300 focus-visible:border-brand-500',
        className,
      )}
    >
      <Search size={17} className="ml-3.5 shrink-0 text-ink-400" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate px-2.5 text-sm text-ink-400">{PLACEHOLDER}</span>
      {!compact && (
        <kbd className="mr-3 hidden rounded-md border border-line bg-white px-1.5 py-0.5 font-sans text-[10px] font-semibold text-ink-500 xl:inline">
          Ctrl K
        </kbd>
      )}
      <span className="flex h-full w-12 shrink-0 items-center justify-center bg-brand-500 text-white transition-colors group-hover:bg-brand-600" aria-hidden="true">
        <Search size={18} strokeWidth={2.2} />
      </span>
    </button>
  );
}

const SEARCH_BAR_ROUTES = /^\/($|shop|category\/|search)/;

/** Full-width search bar under the mobile header (home + listing pages only, not sticky). */
export function MobileSearchBar() {
  const { pathname } = useLocation();
  if (!SEARCH_BAR_ROUTES.test(pathname)) return null;
  return (
    <div className="border-b border-line bg-white lg:hidden">
      <div className="container-page py-2.5">
        <HeaderSearchField compact />
      </div>
    </div>
  );
}
