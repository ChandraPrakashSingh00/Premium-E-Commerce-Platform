import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { ArrowLeft, BarChart3, Lock, Mail, PackageCheck, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Logo } from '@/components/layout/Logo';
import { Button, Input } from '@/components/ui';
import { FormAlert } from '@/features/account/components/FormAlert';
import { useLogin } from '@/features/auth/useSession';
import { applyFieldErrors } from '@/services/apiClient';
import { loginSchema, safeRedirect } from '@/validators/auth';

const adminErrorMessage = (error) => {
  if (error.status === 401) return 'Invalid email or password.';
  if (error.status === 403) return 'This account does not have admin access.';
  if (error.status === 429) return 'Too many attempts. Please wait a few minutes.';
  return error.message;
};

const POINTS = [
  { icon: BarChart3, text: 'Real-time sales, orders and inventory' },
  { icon: PackageCheck, text: 'Manage products, coupons and reviews' },
  { icon: ShieldCheck, text: 'Role-based access with audit logging' },
];

export default function AdminLoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const login = useLogin({ admin: true });
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      const target = safeRedirect(params.get('redirect'), '/admin');
      navigate(target.startsWith('/admin') ? target : '/admin', { replace: true });
    } catch (error) {
      if (!applyFieldErrors(error, setError)) setError('root', { message: adminErrorMessage(error) });
    }
  });

  const pending = isSubmitting || login.isPending;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4 py-8 sm:px-8">
      <Seo title="Admin sign in" noindex />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="grid w-full max-w-md grid-cols-1 overflow-hidden rounded-2xl border border-line bg-white md:max-w-4xl md:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)] *:min-w-0"
      >
        <aside className="relative overflow-hidden bg-ink-900 px-6 py-6 text-white md:flex md:flex-col md:justify-between md:p-10">
          <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-brand-500/25 blur-3xl" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-3">
            <Logo tone="light" subtitle="Admin" />
            <Link to="/" className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm text-white/60 hover:text-white md:hidden">
              <ArrowLeft size={16} aria-hidden="true" /> Store
            </Link>
          </div>
          <div className="relative mt-8 hidden md:block">
            <h2 className="font-display text-3xl leading-tight font-bold text-white">
              Admin <span className="text-brand-400">Console</span>
            </h2>
            <p className="mt-2 text-sm text-white/60">Everything you need to run BlueMart, in one place.</p>
            <ul className="mt-8 space-y-4">
              {POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-300">
                    <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative mt-10 hidden text-xs text-white/40 md:block">Activity in the console is logged.</p>
        </aside>

        <main className="px-6 py-8 sm:px-10 sm:py-12">
          <div className="mb-7 flex items-start justify-between gap-3">
            <div>
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <Lock size={20} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h1 className="font-display text-2xl font-bold text-ink-900">Sign in to Admin</h1>
              <p className="mt-1.5 text-sm text-ink-500">Restricted to authorised staff.</p>
            </div>
            <Link to="/" className="hidden min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-500 hover:text-brand-600 md:inline-flex">
              <ArrowLeft size={16} aria-hidden="true" /> Store
            </Link>
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-4" aria-busy={pending || undefined}>
            <FormAlert message={errors.root?.message} />
            <Input
              id="admin-email"
              label="Email"
              type="email"
              autoComplete="username"
              autoFocus
              leftIcon={<Mail size={18} />}
              placeholder="admin@bluemart.store"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input id="admin-password" label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
            <div className="pt-2">
              <Button type="submit" size="lg" fullWidth loading={pending}>
                Sign In
              </Button>
            </div>
          </form>
          <p className="mt-6 text-center text-xs text-ink-400 md:hidden">Activity in the console is logged.</p>
        </main>
      </motion.div>
    </div>
  );
}
