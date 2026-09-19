import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { storeApi } from '@/features/store/useStoreSettings';

/** Mirrors the backend contact schema. */
export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80, 'Name is too long'),
  email: z.string().trim().min(1, 'Enter your email address').email('Enter a valid email address').max(254),
  subject: z.string().trim().min(3, 'Add a short subject').max(150, 'Keep the subject under 150 characters'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(3000, 'Keep your message under 3000 characters'),
});

export function useSendContactMessage() {
  return useMutation({ mutationFn: (values) => storeApi.contact(values) });
}
