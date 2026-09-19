/**
 * Editorial content for the storefront. Every Unsplash URL below was verified
 * to return HTTP 200 (re-checked with curl for the BlueMart re-skin).
 * Product data never lives here – it always comes from the API.
 */
const unsplash = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

export const HERO = {
  title: 'Everything You Love. Delivered Better.',
  text: 'Premium products. Better prices. Faster delivery.',
  primary: { label: 'Shop Now', to: '/shop' },
  secondary: { label: 'Explore Collection', to: '/shop?featured=true' },
  image: { src: unsplash('1599669454699-248893623440'), alt: 'Black over-ear wireless headphones on a dark background' },
};

/** Hero slider. The first slide carries the brand headline. */
export const HERO_SLIDES = [
  {
    id: 'audio',
    eyebrow: 'New Season Tech',
    title: HERO.title,
    text: HERO.text,
    primary: HERO.primary,
    secondary: HERO.secondary,
    image: HERO.image,
    tag: { label: 'Wireless Audio', value: 'Up to 40% OFF' },
  },
  {
    id: 'mobiles',
    eyebrow: 'Smartphones & Accessories',
    title: 'Upgrade Your Everyday Tech.',
    text: 'Flagship phones, smartwatches and accessories — with secure checkout and easy returns.',
    primary: { label: 'Shop Electronics', to: '/category/electronics' },
    secondary: { label: 'View Best Sellers', to: '/shop?bestSeller=true' },
    image: { src: unsplash('1610945265064-0e34e5519bbf'), alt: 'A lavender smartphone resting on its box on a dark surface' },
    tag: { label: 'Free Delivery', value: 'On orders above ₹999' },
  },
  {
    id: 'footwear',
    eyebrow: 'Footwear Edit',
    title: 'Step Out in Everyday Comfort.',
    text: 'Clean sneakers and performance runners from brands you trust.',
    primary: { label: 'Shop Footwear', to: '/category/footwear' },
    secondary: { label: 'New Arrivals', to: '/shop?newArrival=true' },
    image: { src: unsplash('1608231387042-66d1773070a5'), alt: 'A white leather sneaker on a black background' },
    tag: { label: 'Easy Returns', value: 'Within 7 days' },
  },
];

/** Dark "Best Sellers" banner between product grids. */
export const PROMO = {
  eyebrow: 'Customer Favourites',
  title: 'Best Sellers',
  subtitle: 'On Selected Products',
  text: 'Top-rated watches, audio and everyday essentials — loved by thousands of shoppers.',
  cta: { label: 'Shop Now', to: '/shop?bestSeller=true' },
  image: { src: unsplash('1587836374828-4dbafa94cf0e'), alt: 'A stainless steel wristwatch with a black dial on a black background' },
};

/** Blue "Special Offer" card next to testimonials (FESTIVE20: 20% off up to ₹2,000 on orders above ₹2,999). */
export const SPECIAL_OFFER = {
  eyebrow: 'Special Offer',
  title: 'Get 20% OFF',
  subtitle: 'On Your Next Order',
  code: 'FESTIVE20',
  terms: 'Up to ₹2,000 off on orders above ₹2,999.',
  cta: { label: 'Shop Now', to: '/shop' },
  image: { src: unsplash('1560769629-975ec94e6a86'), alt: 'Colourful sneakers on a white pedestal' },
};

/** Blue newsletter banner (WELCOME10: 10% off the first order up to ₹500 on orders above ₹999). */
export const NEWSLETTER = {
  title: 'Join Our Newsletter',
  text: 'Get new arrivals, exclusive deals and 10% off your first order with code WELCOME10 (up to ₹500 on orders above ₹999).',
  image: { src: unsplash('1546435770-a3e426bf472b'), alt: 'Black wireless headphones on a white desk' },
};

/** Fallback imagery per top-level category slug (used when the API has no image). */
export const CATEGORY_IMAGES = {
  men: unsplash('1617137968427-85924c800a22'),
  women: unsplash('1490481651871-ab68de25d43d'),
  footwear: unsplash('1560343090-f0409e92791a'),
  electronics: unsplash('1526170375885-4d8ecf77b99f'),
  'home-living': unsplash('1555041469-a586c61ea9bc'),
  beauty: unsplash('1522335789203-aabd1fc54bc9'),
  accessories: unsplash('1523275335684-37898b6baf30'),
  'sports-fitness': unsplash('1517836357463-d25dfeac3438'),
  bags: unsplash('1548036328-c9fa89d128fa'),
};

const GENERIC_CATEGORY_IMAGES = [
  unsplash('1441986300917-64674bd600d8'),
  unsplash('1445205170230-053b83016050'),
  unsplash('1512436991641-6745cdb1723f'),
  unsplash('1586023492125-27b2c045efd7'),
];

export const categoryImage = (category, index = 0) =>
  category?.image?.url || (typeof category?.image === 'string' && category.image) || CATEGORY_IMAGES[category?.slug] || GENERIC_CATEGORY_IMAGES[index % GENERIC_CATEGORY_IMAGES.length];

export const SHOP_HERO_IMAGE = unsplash('1441986300917-64674bd600d8');
export const ABOUT_IMAGES = {
  hero: unsplash('1445205170230-053b83016050'),
  studio: unsplash('1558769132-cb1aea458c5e'),
  detail: unsplash('1434389677669-e08b4cac3105'),
};
export const NOT_FOUND_IMAGE = unsplash('1600185365483-26d7a4cc7519');
export const EMPTY_BAG_IMAGE = unsplash('1483985988355-763728e1935b');

export const WHY_US = [
  { icon: 'gem', title: 'Premium Quality', text: 'Every product is checked for quality and authenticity.' },
  { icon: 'shield', title: 'Secure Payments', text: 'UPI, cards and net banking with 100% secure checkout.' },
  { icon: 'truck', title: 'Fast Delivery', text: 'Dispatched within 24 hours, delivered across India.' },
  { icon: 'returns', title: 'Easy Returns', text: 'Hassle-free pickups and refunds within 7 days.' },
  { icon: 'support', title: 'Customer Support', text: 'Real people ready to help, 24/7.' },
];

export const TESTIMONIALS = [
  {
    name: 'Ananya Iyer',
    city: 'Bengaluru',
    rating: 5,
    title: 'Packaging felt like a gift',
    text: 'Ordered a linen dress on Tuesday and it was at my door Thursday morning. The fabric is even better in person and the packaging felt like opening a present.',
    product: 'Women · Dresses',
  },
  {
    name: 'Rohan Mehta',
    city: 'Mumbai',
    rating: 5,
    title: 'Sound that punches above its price',
    text: 'The noise cancellation on my headphones is excellent on the local train. Checkout with UPI took under a minute and tracking was accurate throughout.',
    product: 'Electronics · Audio',
  },
  {
    name: 'Priya Nair',
    city: 'Kochi',
    rating: 4,
    title: 'Returns were genuinely easy',
    text: 'The sneakers ran half a size small, so I requested an exchange. Pickup happened the next day and my refund landed before the new pair arrived.',
    product: 'Footwear · Sneakers',
  },
  {
    name: 'Arjun Kapoor',
    city: 'New Delhi',
    rating: 5,
    title: 'My go-to for gifting',
    text: 'I have bought three birthday gifts here this year. The curation is thoughtful, prices are fair and the support team helped me change an address after ordering.',
    product: 'Accessories · Watches',
  },
];

export const POPULAR_SEARCHES = ['Sneakers', 'Linen shirts', 'Wireless headphones', 'Handbags', 'Skincare', 'Watches'];
