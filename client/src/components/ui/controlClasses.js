import { cn } from '@/utils/cn';

/** Shared visual style for text inputs, selects and textareas. */
export const controlClasses = (error) =>
  cn(
    'w-full rounded-lg border bg-white px-4 text-sm text-ink-900 placeholder:text-ink-400 transition-colors duration-150',
    'focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-400',
    error ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/15' : 'border-line hover:border-ink-300 focus:border-brand-500 focus:ring-brand-500/15',
  );
