import { cn } from '@/utils/cn';

const chip = 'flex h-8 min-w-14 items-center justify-center rounded-md border border-line bg-white px-2.5 text-xs font-bold whitespace-nowrap';

function Mastercard() {
  return (
    <svg width="26" height="16" viewBox="0 0 26 16" aria-hidden="true">
      <circle cx="9" cy="8" r="7" fill="#EB001B" />
      <circle cx="17" cy="8" r="7" fill="#F79E1B" />
      <path d="M13 2.3a7 7 0 0 1 0 11.4 7 7 0 0 1 0-11.4Z" fill="#FF5F00" />
    </svg>
  );
}

const METHODS = [
  { key: 'visa', label: 'Visa', node: <span className="font-display text-[13px] font-extrabold tracking-tight text-[#1A1F71] italic">VISA</span> },
  { key: 'mastercard', label: 'Mastercard', node: <Mastercard /> },
  {
    key: 'rupay',
    label: 'RuPay',
    node: (
      <span className="font-display text-[12px] font-extrabold italic">
        <span className="text-[#097A44]">Ru</span>
        <span className="text-[#F26F21]">Pay</span>
      </span>
    ),
  },
  { key: 'upi', label: 'UPI', node: <span className="font-display text-[12px] font-extrabold text-ink-700 italic">UPI</span> },
  { key: 'netbanking', label: 'NetBanking', node: <span className="text-[11px] font-semibold text-ink-700">NetBanking</span> },
  { key: 'cod', label: 'Cash on Delivery', node: <span className="text-[11px] font-semibold text-success-600">COD</span> },
];

/** "We Accept" payment method chips. */
export function PaymentChips({ className }) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)} aria-label="Accepted payment methods">
      {METHODS.map((m) => (
        <li key={m.key} className={chip}>
          <span className="sr-only">{m.label}</span>
          <span aria-hidden="true" className="flex items-center">
            {m.node}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default PaymentChips;
