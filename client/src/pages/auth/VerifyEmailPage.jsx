import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, MailX, WifiOff } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { Seo } from '@/components/common/Seo';
import { Button, Spinner } from '@/components/ui';
import { useResendVerification } from '@/features/account/hooks';
import { authApi } from '@/features/auth/api';
import { AuthStatus } from '@/features/auth/components/AuthCard';
import { setSessionUser } from '@/features/auth/useSession';
import { useAuthStore } from '@/store/authStore';

function ResendButton() {
  const resend = useResendVerification();
  return (
    <Button size="lg" fullWidth loading={resend.isPending} disabled={resend.isSuccess} onClick={() => resend.mutate()}>
      {resend.isSuccess ? 'New link sent – check your inbox' : 'Send a new link'}
    </Button>
  );
}

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState(token ? { status: 'verifying' } : { status: 'invalid' });
  const requested = useRef(null);

  useEffect(() => {
    // StrictMode mounts effects twice – only ever send a token once.
    if (!token || requested.current === token) return;
    requested.current = token;
    authApi
      .verifyEmail(token)
      .then((verified) => {
        const current = useAuthStore.getState().user;
        if (current && verified && current._id === verified._id) setSessionUser(verified);
        setState({ status: 'success' });
      })
      .catch((error) => {
        if (error.status === 0 || error.status >= 500) setState({ status: 'error', message: error.message });
        else setState({ status: 'invalid', message: error.message });
      });
  }, [token]);

  const alreadyVerified = user?.isEmailVerified;

  return (
    <div className="container-page flex min-h-[60vh] items-center justify-center py-16 sm:py-24">
      <Seo title="Verify email" noindex />
      <div className="w-full max-w-md">
        {state.status === 'verifying' && (
          <AuthStatus icon={<Spinner className="h-7 w-7 text-brand-500" />} title="Verifying your email…" description="This only takes a moment." />
        )}

        {state.status === 'success' && (
          <AuthStatus
            tone="success"
            icon={<BadgeCheck size={30} strokeWidth={1.5} />}
            title="Email verified"
            description="Thank you — your email is confirmed. You will now receive order updates and account alerts."
          >
            {user ? (
              <Button to="/account" size="lg" fullWidth>
                Go to my account
              </Button>
            ) : (
              <Button to="/login" size="lg" fullWidth>
                Sign in
              </Button>
            )}
            <Button to="/shop" variant="ghost" fullWidth>
              Continue shopping
            </Button>
          </AuthStatus>
        )}

        {state.status === 'invalid' && (
          <AuthStatus
            tone="danger"
            icon={<MailX size={28} strokeWidth={1.5} />}
            title={alreadyVerified ? 'You are already verified' : 'This link is invalid or has expired'}
            description={
              alreadyVerified
                ? 'Your email address is already confirmed. No further action is needed.'
                : user
                  ? 'Verification links expire for your security. Request a new one below.'
                  : 'Verification links expire for your security. Sign in to request a new one.'
            }
          >
            {alreadyVerified ? (
              <Button to="/account" size="lg" fullWidth>
                Go to my account
              </Button>
            ) : user ? (
              <ResendButton />
            ) : (
              <Button to="/login?redirect=%2Faccount%2Fsettings" size="lg" fullWidth>
                Sign in
              </Button>
            )}
          </AuthStatus>
        )}

        {state.status === 'error' && (
          <AuthStatus
            icon={<WifiOff size={28} strokeWidth={1.5} />}
            title="We couldn't reach the server"
            description={state.message || 'Check your connection and try again.'}
          >
            <Button size="lg" fullWidth onClick={() => window.location.reload()}>
              Try again
            </Button>
          </AuthStatus>
        )}
      </div>
    </div>
  );
}
