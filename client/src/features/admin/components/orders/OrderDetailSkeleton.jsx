import { Skeleton, SkeletonText } from '@/components/ui';

function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`rounded-xl border border-line bg-white p-5 ${className}`}>
      <Skeleton className="mb-4 h-5 w-32" />
      <SkeletonText lines={lines} />
    </div>
  );
}

export function OrderDetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading order">
      <div className="mb-6 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-line bg-white p-5">
            <Skeleton className="mb-4 h-5 w-24" />
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4 py-3">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="flex-1">
                  <SkeletonText lines={2} />
                </div>
              </div>
            ))}
          </div>
          <CardSkeleton lines={5} />
        </div>
        <div className="space-y-6">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}
