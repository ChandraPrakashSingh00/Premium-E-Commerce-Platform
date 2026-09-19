import { Star, StarHalf } from 'lucide-react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatPrice } from '@/utils/format';

const BADGE_TONES = {
  neutral: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-50 text-brand-600',
  solid: 'bg-brand-500 text-white',
  successSolid: 'bg-success-600 text-white',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  dark: 'bg-ink-900 text-white',
  white: 'bg-white/95 text-ink-900 shadow-sm backdrop-blur',
};

export function Badge({ tone = 'neutral', className, children, dot = false }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs leading-5 font-semibold whitespace-nowrap', BADGE_TONES[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function Card({ as: Tag = 'div', className, padded = true, children, ...props }) {
  return (
    <Tag className={cn('rounded-xl border border-line bg-white', padded && 'p-5 sm:p-6', className)} {...props}>
      {children}
    </Tag>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        <h2 className="text-base font-semibold text-ink-900 sm:text-lg">{title}</h2>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Read-only star rating (supports halves). */
export function Rating({ value = 0, count, size = 14, className, showValue = false }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center" role="img" aria-label={`Rated ${value.toFixed(1)} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => {
          if (rounded >= i) return <Star key={i} size={size} className="fill-amber-400 text-amber-400" aria-hidden="true" />;
          if (rounded === i - 0.5)
            return (
              <span key={i} className="relative inline-flex" aria-hidden="true">
                <Star size={size} className="text-ink-200" />
                <StarHalf size={size} className="absolute inset-0 fill-amber-400 text-amber-400" />
              </span>
            );
          return <Star key={i} size={size} className="fill-ink-200 text-ink-200" aria-hidden="true" />;
        })}
      </div>
      {showValue && <span className="text-sm font-semibold text-ink-900">{value.toFixed(1)}</span>}
      {count !== undefined && <span className="text-xs text-ink-500">({count})</span>}
    </div>
  );
}

/** Interactive rating input. */
export function RatingInput({ value, onChange, size = 28, error }) {
  const labels = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
  return (
    <div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? 's' : ''} – ${labels[i - 1]}`}
            onClick={() => onChange(i)}
            className="rounded-md p-0.5 transition-transform hover:scale-110"
          >
            <Star size={size} className={cn(i <= value ? 'fill-amber-400 text-amber-400' : 'fill-ink-100 text-ink-200')} />
          </button>
        ))}
        {value > 0 && <span className="ml-2 text-sm font-medium text-ink-600">{labels[value - 1]}</span>}
      </div>
      {error && <p className="mt-1 text-xs font-medium text-danger-600">{error}</p>}
    </div>
  );
}

export function Price({ price, compareAtPrice, discount, size = 'md', className }) {
  const hasDiscount = compareAtPrice > price;
  const sizes = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl sm:text-3xl' };
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('font-bold tracking-tight text-ink-900', sizes[size])}>{formatPrice(price)}</span>
      {hasDiscount && (
        <>
          <span className={cn('text-ink-400 line-through', size === 'lg' ? 'text-lg' : 'text-sm')}>
            <span className="sr-only">Original price </span>
            {formatPrice(compareAtPrice)}
          </span>
          {discount > 0 && <span className={cn('font-semibold text-success-600', size === 'lg' ? 'text-base' : 'text-xs')}>{discount}% off</span>}
        </>
      )}
    </div>
  );
}

export function Breadcrumb({ items, className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm', className)}>
      <ol className="scrollbar-none flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-ink-500">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.to && !last ? (
                <Link to={item.to} className="inline-flex min-h-6 items-center hover:text-brand-600">
                  {item.label}
                </Link>
              ) : (
                <span className={cn(last && 'font-medium text-ink-900')} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight size={14} className="text-ink-300" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function Divider({ className, label }) {
  if (!label) return <hr className={cn('border-line', className)} />;
  return (
    <div className={cn('flex items-center gap-3 text-xs font-medium tracking-wider text-ink-400 uppercase', className)}>
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
