import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { controlClasses } from './controlClasses';
import { Field } from './Input';

/**
 * Native select (best accessibility + mobile pickers).
 * options: [{ value, label, disabled? }]
 */
export const Select = forwardRef(function Select(
  { label, hint, error, required, options = [], placeholder, className, selectClassName, size = 'md', id, ...props },
  ref,
) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className} id={id}>
      {({ id: fieldId, describedBy, invalid }) => (
        <div className="relative">
          <select
            ref={ref}
            id={fieldId}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cn(controlClasses(invalid), 'appearance-none pr-10', size === 'sm' ? 'h-10' : 'h-11', selectClassName)}
            {...props}
          >
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-ink-400" aria-hidden="true" />
        </div>
      )}
    </Field>
  );
});
