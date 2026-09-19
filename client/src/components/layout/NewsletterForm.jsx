import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { storeApi } from '@/features/store/useStoreSettings';
import { cn } from '@/utils/cn';

// Plain validation: this form renders on every page, so it avoids pulling form libraries into the entry bundle.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validateEmail = (value) => {
  const email = value.trim();
  if (!email) return 'Enter your email address';
  if (email.length > 254 || !EMAIL_RE.test(email)) return 'Enter a valid email address';
  return null;
};

const TONES = {
  // On ink-900 backgrounds
  dark: {
    input: 'border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/10',
    button: 'light',
    done: 'text-white',
    icon: 'text-brand-400',
    note: 'text-white/40',
    error: 'text-danger-500',
  },
  // On white / surface backgrounds
  light: {
    input: 'border-line bg-white text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:ring-brand-500/15',
    button: 'primary',
    done: 'text-ink-900',
    icon: 'text-success-600',
    note: 'text-ink-400',
    error: 'text-danger-600',
  },
  // On brand-500 banners: white input + dark button
  brand: {
    input: 'border-white bg-white text-ink-900 placeholder:text-ink-400 focus:border-white focus:ring-white/30',
    button: 'dark',
    done: 'text-white',
    icon: 'text-white',
    note: 'text-white/70',
    error: 'rounded-md bg-white px-2 py-1 text-danger-600 inline-block',
  },
};

/**
 * Newsletter sign-up (POST /store/newsletter).
 * Props: `tone` ('dark' | 'light' | 'brand'), `className`, `id`, `showNote`.
 */
export function NewsletterForm({ tone = 'dark', className, id = 'newsletter-email', showNote = true }) {
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const t = TONES[tone] ?? TONES.dark;

  const mutation = useMutation({
    mutationFn: (value) => storeApi.subscribe(value),
    onSuccess: () => setDone(true),
    onError: (err) => setError(err.message || 'Could not subscribe. Please try again.'),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    const problem = validateEmail(email);
    setError(problem);
    if (!problem) mutation.mutate(email.trim());
  };

  if (done) {
    return (
      <p className={cn('flex items-center gap-2.5 text-sm font-medium', t.done, className)} role="status">
        <CheckCircle2 size={20} className={cn('shrink-0', t.icon)} aria-hidden="true" />
        You’re on the list. Watch your inbox for early access.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className={className}>
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <input
          id={id}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="Enter your email address"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            'h-12 min-w-0 flex-1 rounded-lg border px-4 text-sm transition-colors focus:ring-4 focus:outline-none',
            t.input,
            error && 'border-danger-500',
          )}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
        />
        <Button type="submit" variant={t.button} loading={mutation.isPending} className="h-12 px-7">
          Subscribe
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className={cn('mt-2 text-xs font-medium', t.error)}>
          {error}
        </p>
      )}
      {showNote && <p className={cn('mt-3 text-xs', t.note)}>No spam. Unsubscribe anytime.</p>}
    </form>
  );
}

export default NewsletterForm;
