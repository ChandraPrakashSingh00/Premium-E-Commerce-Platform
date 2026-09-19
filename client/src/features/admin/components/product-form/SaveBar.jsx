import { useEffect } from 'react';
import { useBlocker } from 'react-router';
import { Button, ConfirmationModal } from '@/components/ui';
import { cn } from '@/utils/cn';

/**
 * Sticky footer with save actions.
 * actions: [{ key, label, variant, onClick }] – `busyKey` marks the one in flight.
 */
export function SaveBar({ dirty, pending, busyKey, actions, onDiscard, savedLabel }) {
  return (
    <div
      className="sticky bottom-0 z-20 -mx-4 mt-8 -mb-6 border-t border-line bg-white px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mb-8 lg:px-8"
      role="region"
      aria-label="Save product"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm" aria-live="polite">
          <span className={cn('h-2 w-2 rounded-full', dirty ? 'bg-warning-600' : 'bg-ink-300')} aria-hidden="true" />
          <span className={dirty ? 'font-medium text-ink-900' : 'text-ink-500'}>{dirty ? 'Unsaved changes' : savedLabel}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {dirty && onDiscard && (
            <Button variant="ghost" size="sm" onClick={onDiscard} disabled={pending}>
              Discard
            </Button>
          )}
          {actions.map((a) => (
            <Button
              key={a.key}
              variant={a.variant}
              size="sm"
              onClick={a.onClick}
              loading={pending && busyKey === a.key}
              disabled={pending}
              className="flex-1 sm:flex-none"
            >
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Blocks in-app navigation and tab close while the form has unsaved changes. */
export function LeaveGuard({ when }) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname);

  useEffect(() => {
    if (!when) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [when]);

  return (
    <ConfirmationModal
      open={blocker.state === 'blocked'}
      onClose={() => blocker.reset?.()}
      onConfirm={() => blocker.proceed?.()}
      title="Discard unsaved changes?"
      confirmLabel="Discard changes"
      cancelLabel="Keep editing"
    >
      <p className="text-sm text-ink-600">You have changes that haven&apos;t been saved. If you leave now they will be lost.</p>
    </ConfirmationModal>
  );
}
