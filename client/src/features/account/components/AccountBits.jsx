import { MailWarning } from 'lucide-react';
import { Link } from 'react-router';
import { Button, Skeleton } from '@/components/ui';
import { cn } from '@/utils/cn';
import { useResendVerification } from '../hooks';

const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export function Avatar({ name, src, size = 'md', className }) {
  const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-14 w-14 text-base', lg: 'h-20 w-20 text-xl' };
  if (src) return <img src={src} alt="" className={cn('shrink-0 rounded-full object-cover', sizes[size], className)} />;
  return (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center justify-center rounded-full bg-brand-500 font-display font-semibold tracking-wide text-white', sizes[size], className)}
    >
      {initialsOf(name)}
    </span>
  );
}

/** Title block used at the top of each account page. */
export function AccountPageHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function VerifyEmailBanner({ email, className }) {
  const resend = useResendVerification();
  return (
    <div
      role="status"
      className={cn('flex flex-col gap-3 rounded-xl border border-warning-600/20 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between', className)}
    >
      <div className="flex items-start gap-3">
        <MailWarning size={20} className="mt-0.5 shrink-0 text-warning-600" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-semibold text-ink-900">Please verify your email</p>
          <p className="mt-0.5 text-ink-600">
            We sent a link to <span className="font-medium text-ink-900">{email}</span>. Verifying keeps your account secure and lets you receive order updates.
          </p>
        </div>
      </div>
      <Button size="sm" loading={resend.isPending} disabled={resend.isSuccess} onClick={() => resend.mutate()}>
        {resend.isSuccess ? 'Email sent' : 'Resend email'}
      </Button>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, to, loading }) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium text-ink-500">{label}</span>
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
            <Icon size={19} strokeWidth={1.75} aria-hidden="true" />
          </span>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className="mt-2 truncate font-display text-xl font-bold tracking-tight text-ink-900 tabular-nums min-[400px]:text-2xl sm:text-3xl">{value}</p>
      )}
    </>
  );
  const cls = 'block min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5';
  return to ? (
    <Link to={to} className={cn(cls, 'transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-soft')}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
