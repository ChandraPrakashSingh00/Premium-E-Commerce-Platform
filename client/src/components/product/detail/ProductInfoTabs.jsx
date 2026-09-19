import { Check } from 'lucide-react';
import { Tabs } from '@/components/ui';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { formatPrice } from '@/utils/format';

const paragraphs = (text = '') =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

function Bullets({ items }) {
  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-sm text-ink-700">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <Check size={12} strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Panel({ id, active, children }) {
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} hidden={!active} tabIndex={0} className="py-6 focus-visible:outline-offset-4 sm:py-8">
      {children}
    </div>
  );
}

/**
 * Underline tabs: Description · Specifications · Shipping · Return Policy · Reviews.
 * Props: `product`, `value`, `onChange(tab)`, `reviews` (node rendered in the Reviews panel).
 * All panels stay mounted (hidden) so content remains crawlable and review state is preserved.
 */
export function ProductInfoTabs({ product, value, onChange, reviews }) {
  const { settings } = useStoreSettings();
  const attributes = product.attributes ?? [];
  const description = paragraphs(product.description || product.shortDescription || 'No description available.');
  const highlights = attributes.slice(0, 6).map((a) => `${a.name}: ${a.value}`);

  const shipping =
    product.shippingInfo ||
    `Orders are dispatched within 24 hours from our fulfilment centres. Metro cities typically receive deliveries in 2–3 business days and the rest of India in 3–7 business days.${
      settings.freeShippingThreshold > 0
        ? ` Shipping is free on orders above ${formatPrice(settings.freeShippingThreshold)}; a flat fee of ${formatPrice(settings.shippingFee)} applies otherwise.`
        : ''
    }`;
  const returns =
    product.returnPolicy ||
    `Not quite right? Request a return within ${settings.returnWindowDays} days of delivery from your account. Items must be unused, with original tags and packaging. Refunds are issued to the original payment method within 5–7 business days of the item passing quality checks.`;

  const tabs = [
    { value: 'description', label: 'Description' },
    { value: 'specifications', label: 'Specifications' },
    { value: 'shipping', label: 'Shipping' },
    { value: 'returns', label: 'Return Policy' },
    { value: 'reviews', label: 'Reviews', count: product.reviewCount ?? 0 },
  ];

  return (
    <section id="product-info" aria-label="Product information" className="scroll-mt-24">
      <Tabs tabs={tabs} value={value} onChange={onChange} className="-mx-4 gap-2 px-4 sm:mx-0 sm:gap-6 sm:px-0 [&>button]:px-1 [&>button]:py-3.5 [&>button]:text-[15px]" />

      <Panel id="description" active={value === 'description'}>
        <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed whitespace-pre-line text-ink-600">
          {description.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        {highlights.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-base font-semibold">Key Features</h3>
            <Bullets items={highlights} />
          </div>
        )}
        {product.tags?.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
            {product.tags.map((t) => (
              <li key={t} className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-600">
                #{t}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel id="specifications" active={value === 'specifications'}>
        {attributes.length ? (
          <div className="max-w-3xl overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <caption className="sr-only">Product specifications</caption>
              <tbody className="divide-y divide-line">
                {attributes.map((a) => (
                  <tr key={a.name} className="even:bg-surface/60">
                    <th scope="row" className="w-2/5 bg-surface px-4 py-3 text-left align-top font-medium text-ink-600">
                      {a.name}
                    </th>
                    <td className="px-4 py-3 wrap-break-word text-ink-900">{a.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-500">Specifications are not available for this product yet.</p>
        )}
      </Panel>

      <Panel id="shipping" active={value === 'shipping'}>
        <p className="max-w-3xl text-[15px] leading-relaxed whitespace-pre-line text-ink-600">{shipping}</p>
      </Panel>

      <Panel id="returns" active={value === 'returns'}>
        <p className="max-w-3xl text-[15px] leading-relaxed whitespace-pre-line text-ink-600">{returns}</p>
      </Panel>

      <Panel id="reviews" active={value === 'reviews'}>
        {reviews}
      </Panel>
    </section>
  );
}

export default ProductInfoTabs;
