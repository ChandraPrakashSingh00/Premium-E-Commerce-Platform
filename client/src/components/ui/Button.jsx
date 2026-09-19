import { forwardRef } from 'react';
import { Link } from 'react-router';
import { cn } from '@/utils/cn';
import { Spinner } from './Loader';

const VARIANTS = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700',
  outline: 'border border-brand-500 bg-white text-brand-600 hover:bg-brand-50 active:bg-brand-100',
  dark: 'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950',
  secondary: 'bg-white text-ink-900 border border-line hover:border-ink-300 hover:bg-surface',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 hover:text-ink-900',
  light: 'bg-white text-ink-900 hover:bg-ink-100',
  outlineLight: 'border border-white/30 text-white hover:bg-white/10',
  danger: 'bg-danger-600 text-white hover:bg-danger-500',
  link: 'bg-transparent text-brand-600 hover:underline underline-offset-4 px-0 h-auto',
};

const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-7 text-base gap-2.5 rounded-lg',
  icon: 'h-10 w-10 rounded-full',
  iconSm: 'h-8 w-8 rounded-full',
};

/**
 * Button / link-button. Pass `to` for internal navigation or `href` for external links.
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, fullWidth, className, to, href, children, leftIcon, rightIcon, type = 'button', ...props },
  ref,
) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap select-none transition-[background-color,border-color,color,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );
  const content = (
    <>
      {loading ? <Spinner className="h-4 w-4" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {content}
      </Link>
    );
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={classes} target="_blank" rel="noopener noreferrer" {...props}>
        {content}
      </a>
    );
  }
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton({ label, size = 'icon', variant = 'ghost', children, ...props }, ref) {
  return (
    <Button ref={ref} size={size} variant={variant} aria-label={label} title={label} {...props}>
      {children}
    </Button>
  );
});
