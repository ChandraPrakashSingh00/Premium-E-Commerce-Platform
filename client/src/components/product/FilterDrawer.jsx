import { Button, Drawer } from '@/components/ui';
import { formatNumber } from '@/utils/format';
import { FilterPanel } from './FilterPanel';

/**
 * Mobile filter sheet. Filters apply instantly to the URL so the result count in the
 * footer is always live; "Show results" simply closes the sheet.
 * Props: `open`, `onClose`, `facets`, `shop`, `loading`, `hideCategory`, `total`, `fetching`, `onClear`.
 */
export function FilterDrawer({ open, onClose, facets, shop, loading, hideCategory, total, fetching, onClear }) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="bottom"
      title="Filters"
      className="h-[88dvh]"
      headerExtra={
        shop.activeCount > 0 && (
          <button type="button" onClick={onClear} className="min-h-11 px-2 text-sm font-semibold text-brand-600">
            Clear all
          </button>
        )
      }
      footer={
        <Button fullWidth onClick={onClose} loading={fetching}>
          {total === undefined ? 'Show results' : `Show ${formatNumber(total)} ${total === 1 ? 'result' : 'results'}`}
        </Button>
      }
    >
      <div className="px-5 pb-4">
        <FilterPanel facets={facets} shop={shop} loading={loading} hideCategory={hideCategory} />
      </div>
    </Drawer>
  );
}

export default FilterDrawer;
