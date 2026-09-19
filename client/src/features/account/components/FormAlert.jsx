import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/utils/cn';

const TONES = {
  error: { cls: 'border-danger-500/25 bg-danger-50 text-danger-600', Icon: AlertCircle },
  success: { cls: 'border-success-600/20 bg-success-50 text-success-600', Icon: CheckCircle2 },
  info: { cls: 'border-brand-200 bg-brand-50 text-brand-700', Icon: Info },
  warning: { cls: 'border-warning-600/20 bg-warning-50 text-warning-600', Icon: AlertCircle },
};

/** Inline, screen-reader-announced form message. Renders nothing without a message. */
export function FormAlert({ message, tone = 'error', title, className, children }) {
  if (!message && !children) return null;
  const { cls, Icon } = TONES[tone] ?? TONES.error;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-xl border px-4 py-3 text-sm', cls, className)}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {message && <p className={title ? 'mt-0.5' : undefined}>{message}</p>}
        {children}
      </div>
    </div>
  );
}
