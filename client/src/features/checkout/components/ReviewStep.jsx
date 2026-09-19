import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui';
import { OrderItemsList } from '@/features/orders/components';
import { STEP_FORM_ID } from '../useCheckout';

const ISSUE_TEXT = {
  unavailable: 'No longer available',
  out_of_stock: 'Out of stock',
  insufficient_stock: 'Only limited stock left',
  price_changed: 'Price has changed',
};

export function CartIssuesBanner({ items }) {
  const flagged = items.filter((i) => i.issue);
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-warning-600/25 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-warning-600" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-ink-900">Some items need your attention</p>
          <ul className="mt-1 space-y-0.5 text-ink-600">
            {flagged.slice(0, 3).map((i) => (
              <li key={i._id}>
                {i.name} – {ISSUE_TEXT[i.issue] ?? 'Needs review'}
              </li>
            ))}
            {flagged.length === 0 && <li>Your cart changed since you last viewed it.</li>}
          </ul>
        </div>
      </div>
      <Button to="/cart" variant="outline" size="sm" className="self-start sm:self-auto">
        Review Cart
      </Button>
    </div>
  );
}

export function ReviewStep({ items, hasIssues, onConfirm, quoteLoading }) {
  return (
    <form
      id={STEP_FORM_ID}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!hasIssues) onConfirm();
      }}
    >
      {hasIssues && <CartIssuesBanner items={items} />}
      <OrderItemsList items={items} className="-mt-3" />
      <p className="mt-2 border-t border-line pt-3 text-sm text-ink-500">
        Want to change something?{' '}
        <Link to="/cart" className="link">
          Edit your cart
        </Link>
      </p>
      <div className="mt-5 hidden justify-end lg:flex">
        <Button type="submit" rightIcon={<ArrowRight size={18} aria-hidden="true" />} disabled={hasIssues || quoteLoading}>
          Proceed to Payment
        </Button>
      </div>
    </form>
  );
}
