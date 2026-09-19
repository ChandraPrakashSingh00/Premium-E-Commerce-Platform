import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { controlClasses } from './controlClasses';

/** Label + hint + error wrapper. Children receive the generated id through render prop. */
export function Field({ label, hint, error, required, className, children, id: idProp }) {
  const generated = useId();
  const id = idProp || generated;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink-800">
          {label}
          {required && <span className="ml-0.5 text-danger-600" aria-hidden="true">*</span>}
        </label>
      )}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={`${id}-error`} className="text-xs font-medium text-danger-600" role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-ink-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { label, hint, error, required, className, inputClassName, leftIcon, rightElement, type = 'text', id, ...props },
  ref,
) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} id={id}>
      {({ id: fieldId, describedBy, invalid }) => (
        <div className="relative">
          {leftIcon && <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-400">{leftIcon}</span>}
          <input
            ref={ref}
            id={fieldId}
            type={isPassword && reveal ? 'text' : type}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            className={cn(controlClasses(invalid), 'h-11', leftIcon && 'pl-10', (isPassword || rightElement) && 'pr-11', inputClassName)}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 text-ink-400 hover:text-ink-700"
              aria-label={reveal ? 'Hide password' : 'Show password'}
            >
              {reveal ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          {!isPassword && rightElement && <span className="absolute top-1/2 right-3 -translate-y-1/2">{rightElement}</span>}
        </div>
      )}
    </Field>
  );
});

export const Textarea = forwardRef(function Textarea({ label, hint, error, required, className, rows = 4, id, ...props }, ref) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} id={id}>
      {({ id: fieldId, describedBy, invalid }) => (
        <textarea
          ref={ref}
          id={fieldId}
          rows={rows}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(controlClasses(invalid), 'resize-y py-3 leading-relaxed')}
          {...props}
        />
      )}
    </Field>
  );
});
