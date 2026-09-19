import { Link } from 'react-router';
import { BrandMark } from '@/components/brand/BrandMark';
import { cn } from '@/utils/cn';

const SIZES = {
  sm: { mark: 28, text: 'text-lg', tagline: 'text-[9px]' },
  md: { mark: 36, text: 'text-[22px]', tagline: 'text-[10px]' },
  lg: { mark: 48, text: 'text-3xl', tagline: 'text-xs' },
};

/**
 * BlueMart logo: bag mark + "Blue"(brand) "Mart"(ink) wordmark.
 * `tone="light"` for dark backgrounds, `tagline` shows "Shop Smarter. Live Better."
 * Pass `to={null}` to render without a link.
 */
export function Logo({ className, tone = 'dark', to = '/', size = 'md', tagline = false, subtitle }) {
  const s = SIZES[size] ?? SIZES.md;
  const content = (
    <>
      <BrandMark size={s.mark} className="shrink-0" />
      <span className="flex flex-col">
        <span className={cn('font-display leading-none font-extrabold tracking-tight', s.text)}>
          <span className="text-brand-500">Blue</span>
          <span className={tone === 'light' ? 'text-white' : 'text-ink-900'}>Mart</span>
        </span>
        {(tagline || subtitle) && (
          <span className={cn('mt-1 leading-none font-medium tracking-wide', s.tagline, tone === 'light' ? 'text-white/60' : 'text-ink-500')}>
            {subtitle ?? 'Shop Smarter. Live Better.'}
          </span>
        )}
      </span>
    </>
  );
  const classes = cn('inline-flex min-h-11 shrink-0 items-center gap-2', className);
  if (to === null) return <span className={classes}>{content}</span>;
  return (
    <Link to={to} aria-label="BlueMart – home" className={classes}>
      {content}
    </Link>
  );
}

/** Small numeric badge for icon buttons. */
export function CountBadge({ count }) {
  if (!count) return null;
  return (
    <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] leading-none font-bold text-white tabular-nums ring-2 ring-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default Logo;
