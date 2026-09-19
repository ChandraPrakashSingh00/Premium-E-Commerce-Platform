/**
 * Presentation helpers for the checkout UI. The internal state machine in `useCheckout`
 * keeps its four steps (1 Contact · 2 Shipping · 3 Review · 4 Payment); the customer-facing
 * stepper shows Cart → Address → Payment → Success.
 */

export const CHECKOUT_STAGES = [
  { key: 'cart', label: 'Cart' },
  { key: 'address', label: 'Address' },
  { key: 'payment', label: 'Payment' },
  { key: 'success', label: 'Success' },
];

/** Contact + shipping belong to "Address"; review + payment belong to "Payment". */
export const stageForStep = (step) => (step >= 3 ? 'payment' : 'address');

/** Internal step to open when a completed stage is clicked. */
export const STAGE_ENTRY_STEP = { address: 2, payment: 3 };

/**
 * Stepper model for a stage key ('address' | 'payment' | 'success').
 * Returns each stage with `status`: 'complete' | 'current' | 'upcoming'.
 * On the success page every stage (including Success) is complete.
 */
export function checkoutStages(currentStage) {
  const index = CHECKOUT_STAGES.findIndex((s) => s.key === currentStage);
  const done = currentStage === 'success';
  return CHECKOUT_STAGES.map((stage, i) => ({
    ...stage,
    number: i + 1,
    status: done || i < index ? 'complete' : i === index ? 'current' : 'upcoming',
  }));
}

const STEP_LABELS = { 1: 'Continue to Address', 2: 'Deliver to this Address', 3: 'Proceed to Payment' };
const SHORT_LABELS = { 1: 'Continue', 2: 'Deliver Here', 3: 'Go to Payment' };

/**
 * Label (+ `shortLabel` for narrow bars) and disabled state for the primary checkout CTA (summary card and mobile bar).
 * Uses only flags already computed by `useCheckout`; it never touches money.
 */
export function checkoutCta({ step, addingAddress, paymentMethod, hasIssues, blockers = [], quote = {} }) {
  const quotePending = Boolean(quote.isFetching && !quote.data);
  let label = STEP_LABELS[step] ?? 'Continue';
  let shortLabel = SHORT_LABELS[step] ?? label;
  if (step === 2 && addingAddress) [label, shortLabel] = ['Save & Deliver Here', 'Save Address'];
  if (step === 4) label = shortLabel = paymentMethod === 'cod' ? 'Place Order' : 'Pay Now';
  const disabled = (step === 3 && (hasIssues || quotePending)) || (step === 4 && (blockers.length > 0 || quotePending));
  return { label, shortLabel, disabled: Boolean(disabled), final: step === 4 };
}
