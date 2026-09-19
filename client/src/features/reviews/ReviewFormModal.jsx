// Contract: <ReviewFormModal open onClose productId productName review? onSaved? />
//  - review: existing review object (edit mode, PATCH /reviews/:id); otherwise create (POST /reviews)
//  - onSaved(review) called after success.
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Modal, RatingInput, Textarea } from '@/components/ui';
import { applyFieldErrors } from '@/services/apiClient';
import { toast } from '@/store/toastStore';
import { ReviewImageUploader } from './components/ReviewImageUploader';
import { useSaveReview } from './hooks';

const schema = z.object({
  rating: z.number({ error: 'Choose a rating' }).int().min(1, 'Choose a rating').max(5),
  title: z.string().trim().min(3, 'Title should be at least 3 characters').max(120, 'Keep the title under 120 characters'),
  comment: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(3000, 'Keep your review under 3000 characters'),
});

function ReviewForm({ onClose, productId, review, onSaved }) {
  const [images, setImages] = useState(() => (review?.images ?? []).map(({ url, publicId }) => ({ url, publicId })));
  const [uploading, setUploading] = useState(false);
  const save = useSaveReview({ productId, reviewId: review?._id });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rating: review?.rating ?? 0, title: review?.title ?? '', comment: review?.comment ?? '' },
  });
  const commentLength = useWatch({ control, name: 'comment' })?.length ?? 0;

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await save.mutateAsync({ ...values, images });
      const pending = saved?.status === 'pending';
      toast.success(
        review ? 'Review updated' : 'Thanks for your review!',
        pending ? 'It will appear on the product page once it has been approved.' : undefined,
      );
      onSaved?.(saved);
      onClose();
    } catch (error) {
      if (!applyFieldErrors(error, setError)) setError('root', { message: error.message || 'Could not save your review.' });
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-ink-800">Your rating</p>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => <RatingInput value={field.value} onChange={field.onChange} error={errors.rating?.message} />}
        />
      </div>
      <Input label="Title" placeholder="Summarise your experience" maxLength={120} required error={errors.title?.message} {...register('title')} />
      <Textarea
        label="Review"
        rows={5}
        placeholder="What did you like or dislike? How was the fit, quality and delivery?"
        maxLength={3000}
        required
        error={errors.comment?.message}
        hint={`${commentLength}/3000`}
        {...register('comment')}
      />
      <ReviewImageUploader value={images} onChange={setImages} onBusyChange={setUploading} />
      {errors.root && (
        <p className="rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600" role="alert">
          {errors.root.message}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending} disabled={uploading}>
          {review ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}

export default function ReviewFormModal({ open, onClose, productId, productName, review, onSaved }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={review ? 'Edit your review' : 'Write a review'}
      description={productName}
      size="lg"
    >
      <ReviewForm onClose={onClose} productId={productId} review={review} onSaved={onSaved} />
    </Modal>
  );
}
