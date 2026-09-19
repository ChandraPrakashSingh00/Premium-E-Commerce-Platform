import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { Button, SmartImage } from '@/components/ui';
import { formatPrice } from '@/utils/format';

/**
 * `true` once `ref` has scrolled out of the viewport (above it) and the site footer
 * is not yet visible (so the bar never covers the footer's links).
 */
function useScrolledPast(ref) {
  const [past, setPast] = useState(false);
  const [footerVisible, setFooterVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(([entry]) => setPast(!entry.isIntersecting && entry.boundingClientRect.top < 0), {
      rootMargin: '-64px 0px 0px 0px',
    });
    observer.observe(node);
    const footer = document.querySelector('footer');
    const footerObserver = footer ? new IntersectionObserver(([entry]) => setFooterVisible(entry.isIntersecting)) : null;
    if (footer) footerObserver.observe(footer);
    return () => {
      observer.disconnect();
      footerObserver?.disconnect();
    };
  }, [ref]);
  return past && !footerVisible;
}

/**
 * Mobile/tablet bottom purchase bar that appears when the main CTA scrolls out of view.
 * Props: `product`, `purchase` (useProductPurchase), `targetRef` (main CTA element).
 */
export function StickyPurchaseBar({ product, purchase, targetRef }) {
  const visible = useScrolledPast(targetRef);
  const available = purchase.status.available;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.25 }}
          className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-white shadow-[0_-4px_16px_rgb(16_24_40/0.06)] lg:hidden"
          role="region"
          aria-label="Quick purchase"
        >
          <div className="container-page flex items-center gap-2 py-2.5 min-[400px]:gap-3">
            <SmartImage
              src={purchase.images[0]?.url || product.thumbnail}
              alt=""
              width={120}
              aspect="1 / 1"
              className="hidden w-11 shrink-0 rounded-lg border border-line min-[440px]:block"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-ink-500">{product.name}</p>
              <p className="font-display text-base font-bold text-ink-900 tabular-nums">{formatPrice(purchase.price)}</p>
            </div>
            {available && (
              <Button variant="outline" className="min-w-0 shrink! px-3! min-[400px]:px-4!" onClick={purchase.buyNow} loading={purchase.isBuying} disabled={!purchase.canPurchase}>
                Buy Now
              </Button>
            )}
            <Button
              className="min-w-0 shrink! px-3! min-[400px]:px-4!"
              onClick={purchase.addToBag}
              loading={purchase.isAdding}
              disabled={!purchase.canPurchase}
              leftIcon={<ShoppingCart size={16} aria-hidden="true" className="hidden min-[360px]:block" />}
            >
              {available ? 'Add to Cart' : 'Sold out'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StickyPurchaseBar;
