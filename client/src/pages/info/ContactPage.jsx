import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Seo } from '@/components/common/Seo';
import { ListingHeader } from '@/components/product/ListingHeader';
import { Button, Input, Textarea } from '@/components/ui';
import { contactSchema, useSendContactMessage } from '@/features/info/hooks';
import { useStoreSettings } from '@/features/store/useStoreSettings';
import { applyFieldErrors } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';

function ContactDetails() {
  const { settings } = useStoreSettings();
  const rows = [
    settings.supportEmail && { icon: Mail, label: 'Email', value: settings.supportEmail, href: `mailto:${settings.supportEmail}` },
    settings.supportPhone && { icon: Phone, label: 'Phone', value: settings.supportPhone, href: `tel:${settings.supportPhone.replace(/\s/g, '')}` },
    { icon: Clock, label: 'Hours', value: 'Mon – Sat, 9:00 AM – 8:00 PM IST' },
    settings.address && { icon: MapPin, label: 'Office', value: settings.address },
  ].filter(Boolean);

  return (
    <ul className="space-y-6">
      {rows.map(({ icon: Icon, label, value, href }) => (
        <li key={label} className="flex gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-wider text-ink-400 uppercase">{label}</p>
            {href ? (
              <a href={href} className="mt-0.5 block text-[15px] font-medium text-ink-900 hover:text-brand-600">
                {value}
              </a>
            ) : (
              <p className="mt-0.5 text-[15px] font-medium text-ink-900">{value}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ContactForm() {
  const user = useAuthStore((s) => s.user);
  const send = useSendContactMessage();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', subject: '', message: '' },
  });

  const onSubmit = handleSubmit((values) =>
    send.mutate(values, {
      onSuccess: () => reset({ ...values, subject: '', message: '' }),
      onError: (error) => {
        if (!applyFieldErrors(error, setError)) setError('root', { message: error.message });
      },
    }),
  );

  if (send.isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-white px-6 py-16 text-center" role="status">
        <CheckCircle2 size={40} strokeWidth={1.5} className="text-success-600" aria-hidden="true" />
        <h2 className="heading-md mt-5">Message received</h2>
        <p className="mt-2 max-w-sm text-sm text-ink-500">Thanks for reaching out. Our team usually replies within one business day.</p>
        <Button variant="outline" className="mt-6" onClick={() => send.reset()}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 rounded-2xl border border-line bg-white p-5 sm:p-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 [&>*]:min-w-0">
        <Input label="Full name" autoComplete="name" required error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
      </div>
      <Input label="Subject" placeholder="e.g. Question about order ORD-2026-000123" required error={errors.subject?.message} {...register('subject')} />
      <Textarea label="Message" rows={6} placeholder="How can we help?" required error={errors.message?.message} {...register('message')} />
      {errors.root && (
        <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600" role="alert">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" loading={send.isPending} className="w-full px-8 sm:w-auto">
        Send message
      </Button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <div className="container-page pb-16">
      <Seo title="Contact Us" description="Questions about an order, a product or a return? Our support team is here to help." />
      <ListingHeader
        eyebrow="We’re here to help"
        title="Contact Us"
        description="Questions about an order, sizing or returns? Send us a message and a real person will get back to you."
        breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Contact' }]}
      />
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-12 [&>*]:min-w-0">
        <aside aria-label="Contact details" className="self-start rounded-2xl border border-line bg-white p-5 sm:p-6">
          <ContactDetails />
          <p className="mt-6 rounded-xl bg-brand-50 p-4 text-sm leading-relaxed text-ink-600">
            Looking for a quick answer? Most questions about delivery, returns and payments are covered in our{' '}
            <Link to="/faq" className="link">
              FAQ
            </Link>
            .
          </p>
        </aside>
        <ContactForm />
      </div>
    </div>
  );
}
