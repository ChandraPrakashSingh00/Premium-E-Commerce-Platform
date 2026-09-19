import { forwardRef, useId } from 'react';
import { cn } from '@/utils/cn';

export const Checkbox = forwardRef(function Checkbox({ label, description, className, id, error, ...props }, ref) {
  const generated = useId();
  const fieldId = id || generated;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        aria-invalid={error ? true : undefined}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[5px] border-ink-300 accent-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        {...props}
      />
      {(label || description) && (
        <label htmlFor={fieldId} className="cursor-pointer text-sm leading-5 select-none">
          <span className="text-ink-800">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-ink-500">{description}</span>}
          {error && <span className="mt-0.5 block text-xs text-danger-600">{error}</span>}
        </label>
      )}
    </div>
  );
});

export const Radio = forwardRef(function Radio({ label, description, className, id, ...props }, ref) {
  const generated = useId();
  const fieldId = id || generated;
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <input
        ref={ref}
        id={fieldId}
        type="radio"
        className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer accent-brand-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        {...props}
      />
      {(label || description) && (
        <label htmlFor={fieldId} className="cursor-pointer text-sm leading-5 select-none">
          <span className="text-ink-800">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-ink-500">{description}</span>}
        </label>
      )}
    </div>
  );
});

/** Accessible on/off switch. */
export function Switch({ checked, onChange, label, description, disabled, id }) {
  const generated = useId();
  const fieldId = id || generated;
  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <label htmlFor={fieldId} className="text-sm">
          <span className="font-medium text-ink-800">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-ink-500">{description}</span>}
        </label>
      )}
      <button
        id={fieldId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50',
          checked ? 'bg-brand-500' : 'bg-ink-300',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            checked && 'translate-x-5',
          )}
        />
      </button>
    </div>
  );
}
