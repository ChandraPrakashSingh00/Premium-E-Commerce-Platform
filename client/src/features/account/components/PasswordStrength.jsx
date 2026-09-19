import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PASSWORD_RULES, passwordStrength } from '@/validators/auth';

const BAR_COLORS = ['bg-danger-500', 'bg-danger-500', 'bg-warning-600', 'bg-brand-500', 'bg-success-600'];

/** Live strength meter + rule checklist for new-password fields. */
export function PasswordStrength({ value = '', className }) {
  const { score, label } = passwordStrength(value);
  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn('h-1 rounded-full transition-colors duration-300', value && score >= i ? BAR_COLORS[score] : 'bg-ink-100')}
            />
          ))}
        </div>
        <span className="w-16 text-right text-xs font-medium text-ink-600" aria-live="polite">
          {value ? label : ''}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li key={rule.id} className={cn('flex items-center gap-1.5 text-xs transition-colors', ok ? 'text-success-600' : 'text-ink-500')}>
              <Check size={12} strokeWidth={3} className={ok ? 'opacity-100' : 'opacity-30'} aria-hidden="true" />
              {rule.label}
              <span className="sr-only">{ok ? ' – met' : ' – not met'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
