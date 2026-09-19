import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { RouterProvider } from 'react-router';
import { Toaster } from '@/components/ui';
import { useBootstrapSession } from '@/features/auth/useSession';
import { router } from '@/routes';
import { queryClient } from '@/services/queryClient';

function SessionBootstrap() {
  useBootstrapSession();
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <SessionBootstrap />
        <RouterProvider router={router} />
        <Toaster />
      </MotionConfig>
    </QueryClientProvider>
  );
}
