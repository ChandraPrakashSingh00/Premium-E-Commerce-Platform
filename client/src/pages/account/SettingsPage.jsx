import { useState } from 'react';
import { LogOut, MailCheck, MonitorSmartphone } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { Button, Card, CardHeader, ConfirmationModal, Switch } from '@/components/ui';
import { AccountPageHeader } from '@/features/account/components/AccountBits';
import { useLogoutAll, useResendVerification, useUpdatePreferences } from '@/features/account/hooks';
import { useLogout } from '@/features/auth/useSession';
import { useAuthStore } from '@/store/authStore';

const PREFERENCES = [
  { key: 'orderUpdates', label: 'Order updates', description: 'Confirmation, shipping and delivery emails.' },
  { key: 'newsletter', label: 'Newsletter', description: 'New arrivals, editorials and stories, twice a month.' },
  { key: 'promotions', label: 'Offers & promotions', description: 'Early access to sales and member-only codes.' },
];

function ActionRow({ icon: Icon, title, description, children }) {
  return (
    <div className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-900">{title}</p>
          <p className="mt-0.5 text-sm text-ink-500">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updatePrefs = useUpdatePreferences();
  const resend = useResendVerification();
  const logoutAll = useLogoutAll();
  const logout = useLogout();
  const [confirmAll, setConfirmAll] = useState(false);

  if (!user) return null;
  const prefs = user.preferences ?? {};

  return (
    <>
      <Seo title="Settings" noindex />
      <AccountPageHeader title="Settings" description="Communication preferences and account security." />

      <div className="space-y-6">
        <Card>
          <CardHeader title="Email preferences" description="Changes are saved automatically." />
          <div className="divide-y divide-line">
            {PREFERENCES.map((p) => (
              <div key={p.key} className="py-4 first:pt-0 last:pb-0">
                <Switch
                  label={p.label}
                  description={p.description}
                  checked={Boolean(prefs[p.key])}
                  onChange={(checked) => updatePrefs.mutate({ [p.key]: checked })}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Security" />
          <div className="divide-y divide-line">
            {!user.isEmailVerified && (
              <ActionRow icon={MailCheck} title="Verify your email" description={`We will send a fresh link to ${user.email}.`}>
                <Button variant="secondary" size="sm" loading={resend.isPending} disabled={resend.isSuccess} onClick={() => resend.mutate()}>
                  {resend.isSuccess ? 'Email sent' : 'Resend link'}
                </Button>
              </ActionRow>
            )}
            <ActionRow
              icon={MonitorSmartphone}
              title="Sign out of all devices"
              description="Ends every active session, including this one."
            >
              <Button variant="secondary" size="sm" onClick={() => setConfirmAll(true)}>
                Sign out everywhere
              </Button>
            </ActionRow>
            <ActionRow icon={LogOut} title="Sign out" description="Sign out on this device only.">
              <Button variant="ghost" size="sm" loading={logout.isPending} onClick={() => logout.mutate()}>
                Sign out
              </Button>
            </ActionRow>
          </div>
        </Card>
      </div>

      <ConfirmationModal
        open={confirmAll}
        onClose={() => setConfirmAll(false)}
        title="Sign out of all devices?"
        description="You will need to sign in again on every device, including this one."
        confirmLabel="Sign out everywhere"
        loading={logoutAll.isPending}
        onConfirm={() => logoutAll.mutate()}
      >
        <p className="text-sm text-ink-600">Use this if you think someone else has access to your account.</p>
      </ConfirmationModal>
    </>
  );
}
