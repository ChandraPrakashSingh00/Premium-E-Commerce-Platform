import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CircleUserRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button, Input } from '@/components/ui';
import { contactSchema } from '@/validators/checkout';
import { STEP_FORM_ID } from '../useCheckout';

export function ContactStep({ contact, onSubmit, user }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(contactSchema), defaultValues: contact });

  return (
    <form id={STEP_FORM_ID} onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {user?.email && (
        <p className="flex items-center gap-2.5 rounded-lg bg-brand-50 px-3.5 py-2.5 text-sm text-ink-700">
          <CircleUserRound size={18} className="shrink-0 text-brand-500" aria-hidden="true" />
          <span className="min-w-0 wrap-break-word">
            Signed in as <span className="font-semibold text-ink-900">{user.email}</span>
          </span>
        </p>
      )}
      <p className="text-sm text-ink-500">We’ll send your order confirmation and delivery updates here.</p>
      <Input label="Full Name" required autoComplete="name" error={errors.name?.message} {...register('name')} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
        <Input
          label="Email Address"
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Phone Number"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="10-digit mobile"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </div>
      <div className="hidden justify-end pt-1 lg:flex">
        <Button type="submit" rightIcon={<ArrowRight size={18} aria-hidden="true" />}>
          Continue to Address
        </Button>
      </div>
    </form>
  );
}

export function ContactSummary({ contact }) {
  return (
    <span className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-2">
      <span>{contact.name}</span>
      <span className="break-all">{contact.email}</span>
      <span>{contact.phone}</span>
    </span>
  );
}
