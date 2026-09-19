import { useState } from 'react';
import { Button, Modal, Textarea } from '@/components/ui';
import { CharCount } from '../FormSection';

const MAX = 1000;

function ReplyForm({ review, onSubmit }) {
  const [text, setText] = useState(review.adminReply ?? '');
  const [error, setError] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (text.trim().length > MAX) return setError(`Reply must be ${MAX} characters or fewer`);
    setError('');
    onSubmit(text.trim());
  };

  return (
    <form id="review-reply-form" onSubmit={submit} noValidate className="space-y-2">
      <div className="rounded-xl bg-surface px-4 py-3 text-sm">
        <p className="font-semibold text-ink-900">{review.title}</p>
        <p className="mt-1 line-clamp-3 text-ink-600">{review.comment}</p>
      </div>
      <Textarea
        label="Public reply"
        hint="Shown below the review on the product page. Leave empty to remove the reply."
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        error={error}
        data-autofocus
      />
      <div className="flex justify-end">
        <CharCount value={text} max={MAX} />
      </div>
    </form>
  );
}

export function ReviewReplyModal({ review, onClose, onSubmit, loading }) {
  return (
    <Modal
      open={Boolean(review)}
      onClose={loading ? () => {} : onClose}
      title={review?.adminReply ? 'Edit reply' : 'Reply to review'}
      description={review ? `Review by ${review.user?.name ?? 'a customer'}` : undefined}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="review-reply-form" loading={loading}>
            Save reply
          </Button>
        </>
      }
    >
      {/* keyed so the draft resets for each review */}
      {review && <ReplyForm key={review._id} review={review} onSubmit={onSubmit} />}
    </Modal>
  );
}
