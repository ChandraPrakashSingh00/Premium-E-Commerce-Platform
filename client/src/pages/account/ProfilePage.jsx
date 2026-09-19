import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeCheck, Mail } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { Seo } from '@/components/common/Seo';
import { Badge, Button, Card, CardHeader, Input } from '@/components/ui';
import { AccountPageHeader } from '@/features/account/components/AccountBits';
import { FormAlert } from '@/features/account/components/FormAlert';
import { PasswordStrength } from '@/features/account/components/PasswordStrength';
import { useChangePassword, useUpdateProfile } from '@/features/account/hooks';
import { applyFieldErrors } from '@/services/apiClient';
import { useAuthStore } from '@/store/authStore';
import { profileSchema } from '@/validators/account';
import { changePasswordSchema } from '@/validators/auth';

function ProfileForm({ user }) {
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(profileSchema), defaultValues: { name: user.name ?? '', phone: user.phone ?? '' } });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values);
      reset({ name: saved.name ?? '', phone: saved.phone ?? '' });
    } catch (error) {
      if (!applyFieldErrors(error, setError)) setError('root', { message: error.message });
    }
  });

  return (
    <Card>
      <CardHeader title="Personal Details" description="This is how we address you and reach you about deliveries." />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormAlert message={errors.root?.message} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <Input label="Full Name" required autoComplete="name" error={errors.name?.message} {...register('name')} />
          <Input
            label="Phone Number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Optional"
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink-800">Email</p>
          <div className="flex h-11 items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4">
            <span className="flex min-w-0 items-center gap-2 text-sm text-ink-700">
              <Mail size={16} className="shrink-0 text-ink-400" aria-hidden="true" />
              <span className="truncate">{user.email}</span>
            </span>
            {user.isEmailVerified ? (
              <Badge tone="success">
                <BadgeCheck size={12} aria-hidden="true" /> Verified
              </Badge>
            ) : (
              <Badge tone="warning">Unverified</Badge>
            )}
          </div>
          <p className="mt-1.5 text-xs text-ink-500">Contact support to change the email on your account.</p>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={update.isPending} disabled={!isDirty} className="w-full sm:w-auto">
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ChangePasswordForm() {
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword' });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await change.mutateAsync(values);
      reset();
    } catch (error) {
      if (applyFieldErrors(error, setError)) return;
      // A wrong current password is a 400 without field details.
      if (error.status === 400) setError('currentPassword', { message: error.message });
      else setError('root', { message: error.message });
    }
  });

  return (
    <Card>
      <CardHeader title="Password" description="Changing your password signs you out on all other devices." />
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormAlert message={errors.root?.message} />
        <Input
          label="Current password"
          type="password"
          required
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>*]:min-w-0">
          <div className="space-y-2.5">
            <Input
              label="New password"
              type="password"
              required
              autoComplete="new-password"
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />
            {newPassword && <PasswordStrength value={newPassword} />}
          </div>
          <Input
            label="Confirm new password"
            type="password"
            required
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" loading={change.isPending} className="w-full sm:w-auto">
            Update Password
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;
  return (
    <>
      <Seo title="Profile" noindex />
      <AccountPageHeader title="Profile & Security" description="Keep your details up to date." />
      <div className="space-y-6">
        <ProfileForm user={user} />
        <ChangePasswordForm />
      </div>
    </>
  );
}
