import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinkIcon } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, Input } from '@/components/ui';
import { FormAlert } from '@/features/account/components/FormAlert';
import { PasswordStrength } from '@/features/account/components/PasswordStrength';
import { authApi } from '@/features/auth/api';
import { AuthHeader, AuthStatus } from '@/features/auth/components/AuthCard';
import { applyFieldErrors } from '@/services/apiClient';
import { toast } from '@/store/toastStore';
import { resetPasswordSchema } from '@/validators/auth';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [invalidLink, setInvalidLink] = useState(!token || token.length < 16);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: '', confirmPassword: '' } });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async ({ password: pw }) => {
    try {
      await authApi.resetPassword(token, pw);
      toast.success('Password updated', 'Sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (error) {
      const fieldErrors = (error.errors ?? []).filter((e) => !e.field?.startsWith('params.'));
      if (fieldErrors.length && applyFieldErrors({ errors: fieldErrors }, setError)) return;
      if (error.status === 400 || error.errors?.some((e) => e.field?.startsWith('params.'))) setInvalidLink(true);
      else setError('root', { message: error.message });
    }
  });

  if (invalidLink) {
    return (
      <>
        <Seo title="Link expired" noindex />
        <AuthStatus
          tone="danger"
          icon={<LinkIcon size={28} strokeWidth={1.5} />}
          title="This link has expired"
          description="Password reset links can only be used once and expire after a short time. Request a new one to continue."
        >
          <Button to="/forgot-password" size="lg" fullWidth>
            Request a new link
          </Button>
          <Button to="/login" variant="ghost" fullWidth>
            Back to sign in
          </Button>
        </AuthStatus>
      </>
    );
  }

  return (
    <>
      <Seo title="Choose a new password" noindex />
      <AuthHeader title="Choose a new password" description="For your security, this will sign you out of all devices." />
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <FormAlert message={errors.root?.message} />
        <div className="space-y-2.5">
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            autoFocus
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordStrength value={password} />
        </div>
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </>
  );
}
