import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, Input } from '@/components/ui';
import { FormAlert } from '@/features/account/components/FormAlert';
import { authApi } from '@/features/auth/api';
import { AuthHeader, AuthStatus } from '@/features/auth/components/AuthCard';
import { applyFieldErrors } from '@/services/apiClient';
import { forgotPasswordSchema } from '@/validators/auth';

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } });

  const onSubmit = handleSubmit(async ({ email }) => {
    try {
      await authApi.forgotPassword(email);
      setSentTo(email);
    } catch (error) {
      if (applyFieldErrors(error, setError)) return;
      // Only connectivity / rate-limit problems are surfaced – never whether the account exists.
      if (error.status === 0 || error.status === 429) setError('root', { message: error.message });
      else setSentTo(email);
    }
  });

  if (sentTo) {
    return (
      <>
        <Seo title="Check your inbox" noindex />
        <AuthStatus
          tone="brand"
          icon={<MailCheck size={28} strokeWidth={1.5} />}
          title="Check your inbox"
          description={`If an account exists for ${sentTo}, you will receive an email with a link to reset your password. The link expires shortly, so use it soon.`}
        >
          <Button to="/login" size="lg" fullWidth>
            Back to sign in
          </Button>
          <button type="button" onClick={() => setSentTo(null)} className="text-sm font-medium text-ink-600 hover:text-ink-900">
            Didn&apos;t get it? Try another email
          </button>
        </AuthStatus>
      </>
    );
  }

  return (
    <>
      <Seo title="Forgot password" noindex />
      <Link to="/login" className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900">
        <ArrowLeft size={16} aria-hidden="true" /> Sign in
      </Link>
      <AuthHeader title="Reset your password" description="Enter the email you use for your account and we will send you a reset link." />
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormAlert message={errors.root?.message} />
        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </>
  );
}
