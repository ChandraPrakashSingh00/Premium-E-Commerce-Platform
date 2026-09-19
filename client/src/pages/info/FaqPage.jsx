import { MessageCircle } from 'lucide-react';
import { AccordionItem } from '@/components/common/Accordion';
import { Seo } from '@/components/common/Seo';
import { ListingHeader } from '@/components/product/ListingHeader';
import { Button } from '@/components/ui';
import { FAQ_GROUPS } from '@/features/info/faq';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_GROUPS.flatMap((g) => g.items).map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="container-page pb-16">
      <Seo title="FAQ" description="Answers to common questions about orders, shipping, returns, payments and your BlueMart account." jsonLd={jsonLd} />
      <ListingHeader
        eyebrow="Help centre"
        title="Frequently Asked Questions"
        description="Everything you need to know about shopping with BlueMart."
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'FAQ' }]}
      />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 [&>*]:min-w-0">
        <nav aria-label="FAQ topics" className="lg:sticky lg:top-36 lg:self-start lg:rounded-xl lg:border lg:border-line lg:p-2">
          <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
            {FAQ_GROUPS.map((g) => (
              <li key={g.id} className="shrink-0">
                <a
                  href={`#${g.id}`}
                  className="inline-flex min-h-10 items-center rounded-lg border border-line px-4 text-sm font-medium text-ink-700 hover:border-brand-500 hover:text-brand-600 lg:w-full lg:border-0 lg:px-3 lg:hover:bg-brand-50"
                >
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-10">
          {FAQ_GROUPS.map((g) => (
            <section key={g.id} id={g.id} aria-labelledby={`${g.id}-heading`} className="scroll-mt-24 lg:scroll-mt-36">
              <h2 id={`${g.id}-heading`} className="heading-md">
                {g.title}
              </h2>
              <div className="mt-4 rounded-xl border border-line bg-white px-4 sm:px-5 [&>*:last-child]:border-b-0">
                {g.items.map((item) => (
                  <AccordionItem key={item.q} title={item.q}>
                    <p>{item.a}</p>
                  </AccordionItem>
                ))}
              </div>
            </section>
          ))}
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-brand-500 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15" aria-hidden="true">
                <MessageCircle size={22} />
              </span>
              <div>
                <p className="font-display text-xl font-semibold text-white">Still have questions?</p>
                <p className="mt-1 text-sm text-white/80">Our support team replies within one business day.</p>
              </div>
            </div>
            <Button to="/contact" variant="light" className="text-brand-600!">
              Contact support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
