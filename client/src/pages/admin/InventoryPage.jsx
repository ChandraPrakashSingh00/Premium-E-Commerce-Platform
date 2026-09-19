import { Tabs } from '@/components/ui';
import { PageHeader } from '@/features/admin/components';
import { StockLevelsTab } from '@/features/admin/components/inventory/StockLevelsTab';
import { TransactionsTab } from '@/features/admin/components/inventory/TransactionsTab';
import { useListParams } from '@/features/admin/hooks/shared';

const TABS = [
  { value: 'stock', label: 'Stock levels' },
  { value: 'transactions', label: 'Transactions' },
];

export default function InventoryPage() {
  const { params, setParams } = useListParams();
  const tab = params.tab === 'transactions' ? 'transactions' : 'stock';

  // Each tab has its own filters: switching clears the other tab's keys.
  const changeTab = (value) =>
    setParams({ tab: value === 'stock' ? undefined : value, q: undefined, status: undefined, type: undefined, productId: undefined });

  return (
    <>
      <PageHeader title="Inventory" description="Track stock per SKU, make audited adjustments and review every stock movement." />
      <Tabs tabs={TABS} value={tab} onChange={changeTab} className="mb-6" />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'stock' ? <StockLevelsTab /> : <TransactionsTab />}
      </div>
    </>
  );
}
