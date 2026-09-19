import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import { cn } from '@/utils/cn';
import { formatDateTime } from '@/utils/format';
import { useUpdateSettings } from '../../hooks/useSettings';
import { SettingsSections } from './SettingsSections';
import { buildSettingsPatch, SETTINGS_SECTIONS, settingsFormSchema, toSettingsFormValues } from './settingsSchema';

function SectionNav({ active, onSelect }) {
  return (
    <nav aria-label="Settings sections" className="hidden lg:block">
      <ul className="sticky top-24 space-y-0.5">
        {SETTINGS_SECTIONS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              aria-current={active === s.id ? 'true' : undefined}
              className={cn(
                'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                active === s.id ? 'bg-white font-medium text-ink-900 shadow-sm ring-1 ring-line' : 'text-ink-500 hover:bg-white/70 hover:text-ink-900',
              )}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SaveBar({ dirty, saving, onDiscard, updatedAt }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-1 mt-6 px-1 pb-4">
      <div
        className={cn(
          'flex flex-col gap-3 rounded-2xl border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
          dirty ? 'border-ink-300 shadow-lg' : 'border-line',
        )}
      >
        <p className="text-sm" aria-live="polite">
          {dirty ? (
            <span className="inline-flex items-center gap-2 font-medium text-ink-900">
              <span className="h-2 w-2 rounded-full bg-warning-600" aria-hidden="true" />
              Unsaved changes
            </span>
          ) : (
            <span className="text-ink-500">{updatedAt ? `All changes saved · last updated ${formatDateTime(updatedAt)}` : 'All changes saved'}</span>
          )}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onDiscard} disabled={!dirty || saving} className="flex-1 sm:flex-none">
            Discard
          </Button>
          <Button type="submit" size="sm" loading={saving} disabled={!dirty} className="flex-1 sm:flex-none">
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SettingsForm({ settings }) {
  const form = useForm({ resolver: zodResolver(settingsFormSchema), defaultValues: toSettingsFormValues(settings) });
  const {
    handleSubmit,
    reset,
    setError,
    formState: { isDirty, dirtyFields },
  } = form;
  const update = useUpdateSettings();
  const [active, setActive] = useState(SETTINGS_SECTIONS[0].id);
  const [updatedAt, setUpdatedAt] = useState(settings?.updatedAt);

  const onSubmit = (values) => {
    const patch = buildSettingsPatch(values, dirtyFields);
    if (Object.keys(patch).length === 0) return;
    update.mutate(patch, {
      onSuccess: (saved) => {
        reset(toSettingsFormValues(saved));
        setUpdatedAt(saved?.updatedAt);
      },
      onError: (err) => applyFieldErrors(err, setError),
    });
  };

  const scrollTo = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
      <SectionNav active={active} onSelect={scrollTo} />
      <div className="min-w-0">
        <SettingsSections form={form} />
        <SaveBar dirty={isDirty} saving={update.isPending} onDiscard={() => reset()} updatedAt={updatedAt} />
      </div>
    </form>
  );
}
