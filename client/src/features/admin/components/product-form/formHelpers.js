import { get, useFormContext, useFormState } from 'react-hook-form';

/** Returns `(name) => message` for the current form's errors (supports array roots). */
export function useFieldError() {
  const { control } = useFormContext();
  const { errors } = useFormState({ control });
  return (name) => {
    const e = get(errors, name);
    return e?.message ?? e?.root?.message;
  };
}

/** Wraps a `register()` result so typed text is upper-cased (SKUs). */
export const upperCaseField = (field) => ({
  ...field,
  onChange: (event) => {
    const input = event.target;
    const upper = input.value.toUpperCase();
    if (upper !== input.value) {
      const pos = input.selectionStart;
      input.value = upper;
      if (pos !== null) input.setSelectionRange?.(pos, pos);
    }
    return field.onChange(event);
  },
});

export const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'media', label: 'Media' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'variants', label: 'Variants' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'shipping', label: 'Shipping & returns' },
  { id: 'seo', label: 'SEO' },
];

/** Compact control height inside dense editors. */
export const DENSE = 'h-10 rounded-lg';
