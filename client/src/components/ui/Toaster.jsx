import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import { cn } from '@/utils/cn';

const ICONS = {
  success: <CheckCircle2 size={20} className="text-success-600" />,
  error: <AlertCircle size={20} className="text-danger-600" />,
  default: <Info size={20} className="text-brand-500" />,
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[90] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:top-6 sm:right-6 sm:bottom-auto sm:items-end"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-lift',
              t.tone === 'error' ? 'border-danger-500/30' : 'border-line',
            )}
          >
            <span className="mt-0.5 shrink-0">{ICONS[t.tone] ?? ICONS.default}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-sm text-ink-500">{t.description}</p>}
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-2 text-sm font-semibold text-brand-600 hover:underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            <button type="button" onClick={() => dismiss(t.id)} className="-m-1 rounded-full p-1 text-ink-400 hover:text-ink-700" aria-label="Dismiss notification">
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
