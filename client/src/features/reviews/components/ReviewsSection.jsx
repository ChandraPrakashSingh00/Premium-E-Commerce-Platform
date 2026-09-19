import { useRef, useState } from 'react';
import { useProductReviews } from '../hooks';
import { ReviewList } from './ReviewList';
import { ReviewSummary } from './ReviewSummary';
import { WriteReviewCta } from './WriteReviewCta';

const LIMIT = 5;

/** Complete product reviews block (summary, CTA, list). Props: `product` (ProductDetail). */
export function ReviewsSection({ product }) {
  const [sort, setSort] = useState('recent');
  const [rating, setRating] = useState(null);
  const [page, setPage] = useState(1);
  const listRef = useRef(null);
  const query = useProductReviews(product._id, { sort, page, limit: LIMIT, ...(rating && { rating }) });

  const summary = query.data?.meta?.summary ?? {
    average: product.ratingAverage,
    count: product.reviewCount,
    breakdown: product.ratingBreakdown,
  };

  const filterBy = (value) => {
    setRating(value);
    setPage(1);
  };

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
      <h2 id="reviews-heading" className="font-display text-xl font-semibold sm:text-2xl">
        Ratings &amp; Reviews
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-10 [&>*]:min-w-0">
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <ReviewSummary summary={summary} activeRating={rating} onFilter={filterBy} />
          <WriteReviewCta productId={product._id} productName={product.name} />
        </div>
        <div ref={listRef} className="scroll-mt-24">
          <ReviewList
            productId={product._id}
            query={query}
            sort={sort}
            onSort={(v) => {
              setSort(v);
              setPage(1);
            }}
            rating={rating}
            onRating={filterBy}
            onPage={(p) => {
              setPage(p);
              listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default ReviewsSection;
