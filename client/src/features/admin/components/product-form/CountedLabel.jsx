import { useFormContext, useWatch } from 'react-hook-form';
import { CharCount } from '../FormSection';

/** Field label with a live "n/max" character counter. */
export function CountedLabel({ label, name, max }) {
  const { control } = useFormContext();
  const value = useWatch({ control, name });
  return (
    <span className="flex w-full items-center justify-between gap-2">
      <span>{label}</span>
      <CharCount value={value} max={max} />
    </span>
  );
}
