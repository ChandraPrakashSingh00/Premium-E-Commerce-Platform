import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, Input } from '@/components/ui';
import { FormAlert } from '@/features/account/components/FormAlert';
import { AuthHeader } from '@/features/auth/components/AuthCard';
import { useLogin } from '@/features/auth/useSession';
import { applyFieldErrors } from '@/services/apiClient';
import { loginSchema, safeRedirect } from '@/validators/auth';

const loginErrorMessage = (error) => {
  if (error.status === 401) return 'The email or password you entered is incorrect.';
  if (error.status === 429) return 'Too many sign-in attempts. Please wait a few minutes and try again.';
  return error.message;
};

export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const login = useLogin();
  const redirect = params.get('redirect');
  const withRedirect = (path) => (redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      navigate(safeRedirect(redirect, '/account'), { replace: true });
    } catch (error) {
      if (!applyFieldErrors(error, setError)) setError('root', { message: loginErrorMessage(error) });
    }
  });

  const pending = isSubmitting || login.isPending;

  return (
    <>
      <Seo title="Sign in" description="Sign in to your account to track orders and check out faster." noindex />
      <AuthHeader
        eyebrow="Welcome back"
        title="Login to your account"
        description={redirect?.startsWith('/checkout') ? 'Sign in to continue to secure checkout.' : 'Sign in to your account to continue.'}
      />

      <form onSubmit={onSubmit} noValidate className="space-y-5" aria-busy={pending || undefined}>
        <FormAlert message={errors.root?.message} />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoFocus
          leftIcon={<Mail size={18} />}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div>
          <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
          <div className="mt-1 flex justify-end">
            <Link to="/forgot-password" className="inline-flex min-h-9 items-center text-sm font-semibold text-brand-600 underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" fullWidth loading={pending}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 border-t border-line pt-6 text-center text-sm text-ink-500">
        New to BlueMart?{' '}
        <Link to={withRedirect('/register')} className="link">
          Create an account
        </Link>
      </p>
    </>
  );
}
