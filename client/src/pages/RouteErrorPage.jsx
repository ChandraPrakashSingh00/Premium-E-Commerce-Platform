import { isRouteErrorResponse, useRouteError } from 'react-router';
import Logo from '@/components/layout/Logo';
import { Button } from '@/components/ui';

/** Router-level error boundary (render errors, failed lazy chunks, 404s outside layouts). */
export default function RouteErrorPage() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const chunkFailed = error instanceof Error && /Failed to fetch dynamically imported module|Importing a module script failed/i.test(error.message);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-6 text-center">
      <Logo size="lg" className="mb-10" />
      <p className="eyebrow">{is404 ? '404' : 'Unexpected error'}</p>
      <h1 className="mt-3 heading-lg">{is404 ? 'This page does not exist' : chunkFailed ? 'A new version is available' : 'Something went wrong'}</h1>
      <p className="mt-3 max-w-md text-ink-500">
        {chunkFailed
          ? 'Please reload the page to get the latest version of the store.'
          : is404
            ? 'The page you are looking for may have moved or no longer exists.'
            : 'We hit an unexpected problem. Please try again in a moment.'}
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={() => window.location.reload()} variant="secondary">
          Reload
        </Button>
        <Button to="/">Back to home</Button>
      </div>
    </main>
  );
}
