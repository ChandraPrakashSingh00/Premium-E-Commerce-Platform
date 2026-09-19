/** Where the checkout CTA should go (guests sign in first and return to checkout). */
export const checkoutPath = (isGuest) => (isGuest ? `/login?redirect=${encodeURIComponent('/checkout')}` : '/checkout');
