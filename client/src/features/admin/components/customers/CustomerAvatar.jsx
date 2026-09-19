import { cn } from '@/utils/cn';

const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

/** Initials avatar used in the customers table and drawer. */
export function CustomerAvatar({ name, size = 'md', className }) {
  const sizes = { sm: 'h-8 w-8 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-14 w-14 text-base' };
  return (
    <span
      aria-hidden="true"
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full bg-ink-100 font-semibold text-ink-700', sizes[size], className)}
    >
      {initialsOf(name)}
    </span>
  );
}
