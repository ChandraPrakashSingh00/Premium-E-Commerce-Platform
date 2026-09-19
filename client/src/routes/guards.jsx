import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import { FullScreenLoader } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';

const useSessionReady = () => {
  const status = useAuthStore((s) => s.status);
  return status !== 'idle' && status !== 'loading';
};

/** Signed-in customers (and admins) only. */
export function RequireAuth() {
  const ready = useSessionReady();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!ready) return <FullScreenLoader />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  return <Outlet />;
}

/** ADMIN role only. */
export function RequireAdmin() {
  const ready = useSessionReady();
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  if (!ready) return <FullScreenLoader />;
  if (!user || user.role !== 'ADMIN') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?redirect=${redirect}`} replace />;
  }
  return <Outlet />;
}

/** Only for signed-out visitors (login/register). Signed-in users are sent on. */
export function GuestOnly({ admin = false }) {
  const ready = useSessionReady();
  const user = useAuthStore((s) => s.user);
  const [params] = useSearchParams();
  if (!ready) return <FullScreenLoader />;
  if (user && (!admin || user.role === 'ADMIN')) {
    const redirect = params.get('redirect');
    const safe = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : null;
    return <Navigate to={safe || (user.role === 'ADMIN' && admin ? '/admin' : '/account')} replace />;
  }
  return <Outlet />;
}
