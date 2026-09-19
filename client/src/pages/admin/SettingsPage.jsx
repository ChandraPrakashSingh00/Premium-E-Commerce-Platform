import { Card, ErrorState, Skeleton, Tabs } from '@/components/ui';
import { PageHeader } from '@/features/admin/components';
import { MessagesPanel } from '@/features/admin/components/settings/MessagesPanel';
import { SettingsForm } from '@/features/admin/components/settings/SettingsForm';
import { useListParams } from '@/features/admin/hooks/shared';
import { useAdminSettings } from '@/features/admin/hooks/useSettings';

const TABS = [
  { value: 'store', label: 'Store settings' },
  { value: 'messages', label: 'Messages' },
];

function SettingsSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8" aria-busy="true">
      <div className="hidden space-y-2 lg:block">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 rounded-lg" />
        ))}
      </div>
      <div className="space-y-6">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
              <Skeleton className="h-12 rounded-xl" />
              <Skeleton className="h-12 rounded-xl" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StoreSettings() {
  const query = useAdminSettings();
  if (query.isPending) return <SettingsSkeleton />;
  if (query.isError) {
    return (
      <Card>
        <ErrorState error={query.error} onRetry={query.refetch} compact />
      </Card>
    );
  }
  // Keyed on the loaded document so a refetch from elsewhere doesn't clobber in-progress edits.
  return <SettingsForm key={query.data?._id ?? 'settings'} settings={query.data} />;
}

export default function SettingsPage() {
  const { params, setParams } = useListParams();
  const tab = params.tab === 'messages' ? 'messages' : 'store';

  return (
    <>
      <PageHeader title="Settings" description="Store details, checkout rules and the contact inbox." />
      <Tabs tabs={TABS} value={tab} onChange={(v) => setParams({ tab: v === 'store' ? undefined : v, mstatus: undefined })} className="mb-6" />
      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'store' ? (
          <StoreSettings />
        ) : (
          <MessagesPanel
            status={params.mstatus ?? ''}
            page={params.page}
            onStatusFilter={(v) => setParams({ mstatus: v })}
            onPageChange={(p) => setParams({ page: p })}
          />
        )}
      </div>
    </>
  );
}
