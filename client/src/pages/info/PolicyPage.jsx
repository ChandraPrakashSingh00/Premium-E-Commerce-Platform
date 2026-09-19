import { Link } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { ListingHeader } from '@/components/product/ListingHeader';
import { POLICIES } from '@/features/info/policies';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { formatDate, formatPrice } from '@/utils/format';

const OTHER = [
  { key: 'privacy', to: '/privacy-policy' },
  { key: 'terms', to: '/terms' },
  { key: 'refund', to: '/refund-policy' },
  { key: 'shipping', to: '/shipping-policy' },
];

function useFill() {
  const { settings } = useStoreSettings();
  const values = {
    returnWindowDays: settings.returnWindowDays,
    freeShippingThreshold: formatPrice(settings.freeShippingThreshold),
    shippingFee: formatPrice(settings.shippingFee),
    supportEmail: settings.supportEmail,
    supportPhone: settings.supportPhone,
    address: settings.address || 'our registered office',
  };
  return (text) => text.replace(/\{(\w+)\}/g, (m, key) => (values[key] !== undefined ? String(values[key]) : m));
}

/** Legal/help policy page. Props: `policy` ('privacy' | 'terms' | 'refund' | 'shipping'). */
export default function PolicyPage({ policy = 'privacy' }) {
  const doc = POLICIES[policy] ?? POLICIES.privacy;
  const fill = useFill();

  return (
    <div className="container-page pb-16">
      <Seo title={doc.title} description={doc.description} />
      <ListingHeader
        eyebrow="Policies"
        title={doc.title}
        description={`Last updated ${formatDate(doc.updated, { day: 'numeric', month: 'long', year: 'numeric' })}`}
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: doc.title }]}
      />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12 [&>*]:min-w-0">
        <aside className="lg:sticky lg:top-36 lg:self-start">
          <nav aria-label="On this page" className="rounded-xl border border-line bg-white p-5">
            <p className="text-xs font-semibold tracking-wider text-ink-400 uppercase">On this page</p>
            <ol className="mt-3 space-y-1">
              {doc.sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex min-h-9 items-center gap-2 text-sm text-ink-600 hover:text-brand-600">
                    <span className="w-5 text-xs font-semibold text-brand-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <nav aria-label="Other policies" className="mt-6 hidden lg:block">
            <p className="px-1 text-xs font-semibold tracking-wider text-ink-400 uppercase">Other policies</p>
            <ul className="mt-2">
              {OTHER.filter((o) => o.key !== policy).map((o) => (
                <li key={o.key}>
                  <Link to={o.to} className="flex min-h-9 items-center px-1 text-sm text-ink-600 hover:text-brand-600">
                    {POLICIES[o.key].title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <article className="max-w-3xl">
          <p className="text-lg leading-relaxed text-ink-700">{fill(doc.intro)}</p>
          {doc.sections.map((s, i) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="mt-10 scroll-mt-24 border-t border-line pt-8 lg:scroll-mt-36">
              <h2 id={`${s.id}-h`} className="heading-md flex items-baseline gap-3">
                <span className="font-sans text-sm font-semibold text-brand-500 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>
              {s.paragraphs.map((p) => (
                <p key={p.slice(0, 40)} className="mt-4 text-[15px] leading-relaxed text-ink-600">
                  {fill(p)}
                </p>
              ))}
              {s.list && (
                <ul className="mt-4 space-y-2.5">
                  {s.list.map((item) => (
                    <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-ink-600">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />
                      {fill(item)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <p className="mt-12 rounded-xl bg-brand-50 p-5 text-sm text-ink-600">
            Questions about this policy?{' '}
            <Link to="/contact" className="link">
              Contact our support team
            </Link>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
