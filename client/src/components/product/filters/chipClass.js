import { cn } from '@/utils/cn';

/** Pill-style toggle used across filter groups (selected = blue border + blue text on brand-50). */
export const chipClass = (active) =>
  cn(
    'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
    active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line bg-white text-ink-700 hover:border-brand-300 hover:text-ink-900',
  );
