import { cn } from '@/utils/cn';
import { ProductCard, ProductCardSkeleton } from './ProductCard';

const COLUMNS = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 md:grid-cols-3 2xl:grid-cols-4',
  4: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
};

const SIZES = {
  2: '(min-width: 640px) 45vw, 48vw',
  3: '(min-width: 1536px) 20vw, (min-width: 1024px) 26vw, (min-width: 768px) 30vw, 48vw',
  4: '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 48vw',
};

/**
 * Responsive product grid.
 * Props: `items`, `loading`, `columns` (2 | 3 | 4), `skeletonCount`, `priorityCount`, `className`.
 */
export function ProductGrid({ items = [], loading = false, columns = 4, skeletonCount = 8, priorityCount = 0, className }) {
  const grid = cn('grid gap-3 sm:gap-4 lg:gap-5 [&>*]:min-w-0', COLUMNS[columns], className);
  if (loading) {
    return (
      <div className={grid} role="status" aria-label="Loading products">
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  return (
    <ul className={grid}>
      {items.map((product, i) => (
        <li key={product._id} className="flex min-w-0">
          <ProductCard product={product} priority={i < priorityCount} sizes={SIZES[columns]} className="w-full" />
        </li>
      ))}
    </ul>
  );
}

export default ProductGrid;
