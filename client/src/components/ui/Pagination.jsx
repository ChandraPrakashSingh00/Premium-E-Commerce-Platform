import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

function pageList(page, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

export function Pagination({ page, totalPages, onChange, className }) {
  if (!totalPages || totalPages <= 1) return null;
  const btn = 'inline-flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-40';
  return (
    <nav className={cn('flex items-center justify-center gap-1.5', className)} aria-label="Pagination">
      <button type="button" className={cn(btn, 'border border-line bg-white text-ink-700 hover:border-brand-500 hover:text-brand-600')} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <ChevronLeft size={18} />
      </button>
      <div className="hidden items-center gap-1.5 sm:flex">
        {pageList(page, totalPages).map((p) =>
          typeof p === 'string' ? (
            <span key={p} className="px-1 text-ink-400" aria-hidden="true">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
              aria-label={`Page ${p}`}
              className={cn(btn, p === page ? 'border border-brand-500 bg-brand-500 text-white' : 'border border-line bg-white text-ink-700 hover:border-brand-500 hover:text-brand-600')}
            >
              {p}
            </button>
          ),
        )}
      </div>
      <span className="px-3 text-sm text-ink-600 sm:hidden">
        Page {page} of {totalPages}
      </span>
      <button type="button" className={cn(btn, 'border border-line bg-white text-ink-700 hover:border-brand-500 hover:text-brand-600')} onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
