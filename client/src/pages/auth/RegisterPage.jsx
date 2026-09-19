import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, Checkbox, Input } from '@/components/ui';
import { FormAlert } from '@/features/account/components/FormAlert';
import { PasswordStrength } from '@/features/account/components/PasswordStrength';
import { AuthHeader } from '@/features/auth/components/AuthCard';
import { useRegister } from '@/features/auth/useSession';
import { applyFieldErrors } from '@/services/apiClient';
import { toast } from '@/store/toastStore';
import { registerSchema, safeRedirect } from '@/validators/auth';

export default function RegisterPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const signUp = useRegister();
  const redirect = params.get('redirect');

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '', acceptTerms: false },
  });
  const password = useWatch({ control, name: 'password' });

  const onSubmit = handleSubmit(async ({ name, email, phone, password: pw }) => {
    try {
      const user = await signUp.mutateAsync({ name, email, password: pw, ...(phone && { phone }) });
      toast.show({
        tone: 'success',
        title: `Welcome, ${user?.name?.split(' ')[0] ?? 'friend'}!`,
        description: `We sent a verification link to ${email}.`,
        duration: 6000,
      });
      navigate(safeRedirect(redirect, '/account'), { replace: true });
    } catch (error) {
      if (applyFieldErrors(error, setError)) return;
      if (error.status === 409) setError('email', { message: 'An account with this email already exists.' });
      else setError('root', { message: error.message });
    }
  });

  const pending = isSubmitting || signUp.isPending;

  return (
    <>
      <Seo title="Create account" description="Create an account for faster checkout, order tracking and saved favourites." noindex />
      <AuthHeader eyebrow="Join BlueMart" title="Create your account" description="Faster checkout, order tracking and a wishlist that follows you." />

      <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={pending || undefined}>
        <FormAlert message={errors.root?.message} />
        <Input label="Full Name" required autoComplete="name" autoFocus error={errors.name?.message} {...register('name')} />
        <Input label="Email" required type="email" inputMode="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Phone Number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="Optional"
          hint="For delivery updates only."
          error={errors.phone?.message}
          {...register('phone')}
        />
        <div className="space-y-2.5">
          <Input label="Password" required type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
          <PasswordStrength value={password} />
        </div>
        <Input
          label="Confirm Password"
          required
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Checkbox
          className="pt-1"
          error={errors.acceptTerms?.message}
          label={
            <>
              I agree to the{' '}
              <Link to="/terms" target="_blank" rel="noopener" className="link">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy-policy" target="_blank" rel="noopener" className="link">
                Privacy Policy
              </Link>
            </>
          }
          {...register('acceptTerms')}
        />
        <div className="pt-2">
          <Button type="submit" size="lg" fullWidth loading={pending}>
            Create Account
          </Button>
        </div>
      </form>

      <p className="mt-6 border-t border-line pt-6 text-center text-sm text-ink-500">
        Already have an account?{' '}
        <Link to={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'} className="link">
          Login
        </Link>
      </p>
    </>
  );
}
