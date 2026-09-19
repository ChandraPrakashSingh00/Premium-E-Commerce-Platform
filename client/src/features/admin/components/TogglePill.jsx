import { cn } from '@/utils/cn';

/**
 * Status pill that doubles as an on/off switch: green "Published" / grey "Draft".
 * `label` names the setting for assistive tech (state is conveyed by aria-checked).
 */
export function TogglePill({ checked, onChange, disabled, label, onText = 'Published', offText = 'Draft', className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={checked ? `${onText} — click to switch to ${offText.toLowerCase()}` : `${offText} — click to switch to ${onText.toLowerCase()}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full py-0.5 pr-1 pl-2.5 text-xs leading-5 font-semibold whitespace-nowrap transition-colors disabled:opacity-60',
        checked ? 'bg-success-50 text-success-600 hover:bg-success-600/15' : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
        className,
      )}
    >
      {checked ? onText : offText}
      <span className={cn('relative inline-flex h-3.5 w-6 shrink-0 rounded-full transition-colors', checked ? 'bg-success-600' : 'bg-ink-300')} aria-hidden="true">
        <span className={cn('absolute top-0.5 left-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform', checked && 'translate-x-2.5')} />
      </span>
    </button>
  );
}
