# BlueMart Design System & UI Spec

Source: the approved BlueMart UI board (homepage, shop, product details, cart, checkout, admin dashboard, mobile view, admin products, admin orders) and the BlueMart logo. This document describes that board precisely so every page can be built to match.

## Brand

- **Name:** BlueMart. **Tagline:** "Shop Smarter. Live Better." (secondary line: "Your Style. Our Priority.")
- **Logo:** `components/layout/Logo.jsx` (`<Logo size="sm|md|lg" tone="dark|light" tagline />`), which combines `components/brand/BrandMark.jsx` (blue shopping bag with a white "B" and three motion lines on the left) with the wordmark "**Blue**" in brand blue and "**Mart**" in ink (white on dark backgrounds). Always use these components; never type the brand as plain text in a header.
- **Palette:** exactly these values, exposed as Tailwind tokens.

| Token | Hex | Use |
| --- | --- | --- |
| `brand-500` | `#086FFD` | Primary buttons ("Add to Cart", "Proceed to Checkout"), active nav, links, badges, charts, stepper, pagination active, focus |
| `brand-600/700` | darker blues | Hover / pressed |
| `brand-50/100` | light blues | Icon circles, selected option backgrounds, subtle highlights |
| `ink-900` | `#191B1F` | Text, dark hero/banner backgrounds, admin sidebar |
| `surface` | `#F5F7FA` | Page backgrounds, product image wells, category tiles, admin content area |
| `line` | `#E5E7EB` | Borders, dividers, table rules |
| `white` | `#FFFFFF` | Cards, header, inputs |
| success / warning / danger | green / amber / red | "In Stock", "% OFF", "Delivered", "Paid" (green); "Pending" (amber); errors, "Cancelled" (red) |

- **Typography:** headings use `font-display` (Poppins 600–800) and body text uses Inter. Section titles are ~20–24px semibold, page titles ~28–32px bold, and product names are 14–15px medium.
- **Shape:** cards `rounded-xl`/`rounded-2xl` with a `border-line` hairline and white background. Buttons `rounded-lg`, 40–44px tall, with bold labels. Inputs `rounded-lg`, 44px.
- **Elevation:** almost flat. Use `shadow-soft` only on hover or floating panels. No heavy shadows.
- **Feel:** a bright, trustworthy, modern marketplace (clean Flipkart/Croma-style retail with premium polish). Blue is used generously for actions, never as a full-page background (except the newsletter and offer banners). Dark `ink-900` blocks are reserved for hero and promo banners and the admin sidebar.
- **Icons:** lucide-react, 1.75 stroke.

## Global storefront chrome

- **Top trust bar (desktop, above or below the header):** four items in a row, each a blue outline icon with a bold title and a muted subtitle:
  - Free Shipping — On Orders Above ₹999
  - Secure Payments — 100% Secure
  - Easy Returns — Within 7 Days
  - 24/7 Support — We're Here to Help

  On mobile this collapses to the single-line announcement.
- **Header (white, sticky, bottom border):**
  - Left: `Logo`.
  - Centre: a wide search field (rounded-lg, light-grey fill) with a blue square search button on its right end; it opens the existing search overlay and suggestions.
  - Right: notification bell, wishlist heart, account, and cart icon buttons, each with a small blue count badge.
  - Desktop only, a second row or inline links: Shop, Categories (mega menu), New Arrivals, Best Sellers, Offers.
  - Mobile: logo left; search, bell and cart icons right; a full-width search bar below the header row on home/shop.
- **Mobile bottom nav:** Home, Categories/Shop, Search, Wishlist, Account. White with a top border; the active item is brand blue.
- **Pre-footer trust band (dark `ink-900`):** five items (Premium Quality, Secure Payments, Fast Delivery, Easy Returns, 24/7 Support), each an outlined circular white icon with a white title and a muted subtitle.
- **Footer (white/surface):**
  - Brand column: logo + tagline, support email and phone, social icons.
  - Link columns: Company, Shop, Support, Policies.
  - "We Accept" row: payment chips (Visa, Mastercard, RuPay, UPI, NetBanking, COD).
  - Bottom bar: "© 2026 BlueMart. All rights reserved." on the left, small links on the right.

## Pages

### 1. Homepage
1. **Hero:** a large rounded dark banner (`ink-900`, subtle blue glow at the edges, no loud gradient).
   - Left: headline "Everything You Love. Delivered Better." (white, 40–56px, bold); subtext "Premium products. Better prices. Faster delivery."; a blue "Shop Now" button and a white-outline "Explore Collection" button.
   - Right: a big product image (headphones or electronics on a dark background).
   - Slider arrows and dots; slides are optional, and a single slide is acceptable.
2. **Shop by Category:** a row of 7–8 square tiles. Each tile is a light-grey (`surface`) rounded square with the category image centred, and the label sits below it (Electronics, Fashion, Home & Living, Beauty, Sports, …). The row scrolls horizontally on mobile.
3. **Trending Products:** title on the left, blue "View All" link on the right, and a 4-column product-card grid (2 columns on mobile).
4. **Best Sellers banner:** a wide dark rounded banner. "Best Sellers" and "On Selected Products" are in white, with a blue "Shop Now" button, and a product image (watch) on the right.
5. **New Arrivals** and **Best Sellers** product grids (same card).
6. **Why Choose Us:** five columns, each a light-blue (`brand-50`) circle with a blue icon, a bold title and a small muted line: Premium Quality, Secure Payments, Fast Delivery, Easy Returns, Customer Support.
7. **What Our Customers Say:**
   - Three testimonial cards, each with an avatar, name, amber stars and a short quote.
   - A **Special Offer** card beside them: solid `brand-500` background, white text "Special Offer / Get 20% OFF / On Your Next Order", a white "Shop Now" button and a product image.
8. **Newsletter banner:** a full-width rounded `brand-500` banner containing "Join Our Newsletter", a supporting line, a white email input with a dark "Subscribe" button, and a product image on the right.

### Product card (used everywhere)
- White card with a `line` border and `rounded-xl`; the whole card is clickable.
- **Image area:** `surface` background, square ratio, product image centred (object-contain, or cover for photos), rounded top.
  - Top-left: a small discount badge (e.g. "-20%", blue or green pill) plus "New" and "Bestseller" chips.
  - Top-right: a round white wishlist heart button.
- **Body:**
  - Brand name (xs, muted uppercase).
  - Product name (sm, medium, 2-line clamp).
  - Amber stars with a muted review count.
  - Price row: bold price, struck-through MRP, and a green "x% off".
- **Footer:** a **full-width blue "Add to Cart" button** (cart icon, h-9/h-10, rounded-lg).
  - It becomes "View Options" (outline) when the product has several variants.
  - It is disabled and reads "Out of Stock" when stock is 0.
- **Hover:** border darkens, the image zooms in slightly, and the card gets `shadow-soft`.

### 2. Shop page
- Breadcrumb and "Shop" title.
- **Left sidebar (white card, "Filters" heading with a "Clear all" action):** collapsible sections.
  - **Category** and **Brand:** checkboxes with counts.
  - **Price Range:** range options plus min/max inputs.
  - **Rating:** "4★ & up", etc.
  - **Discount** and **Availability** (In Stock / Out of Stock).
  - **Size:** pills.
  - **Color:** round swatches.
- **Top bar:** result count, a search-within field, and a "Sort by" select.
- **Grid:** 3 columns (4 on wide screens) of product cards.
- **Pagination:** centred numbered buttons; the active page is filled blue.
- **Mobile:** a sticky "Filters" and "Sort" button pair; filters open in a bottom drawer.

### 3. Product details
- **Breadcrumb:** Home › Category › Sub-category › Product.
- **Left, gallery:** vertical thumbnail column (active thumbnail has a blue border) plus a large image in a `surface` rounded box with zoom.
- **Right, purchase panel:**
  - Title (26–30px bold) and brand (link).
  - Amber rating with "(124 reviews)".
  - **Price:** large bold price, struck MRP, and a green "12% OFF" pill.
  - **Stock line:** green "● In Stock" and "SKU: …" on the same line.
  - **Color:** image or colour swatch tiles; selected has a blue ring.
  - **Size/Storage:** pill buttons; selected is blue border and blue text on a `brand-50` background.
  - **Quantity:** stepper.
  - **Buttons row:** "Add to Cart" (solid blue with cart icon) and "Buy Now" (blue outline), equal width.
  - "Add to Wishlist" text button with a heart.
  - **Mini trust row:** Free Shipping · Secure Payment · 7 Days Return, with icons.
- **Below:** underline tabs (Description · Specifications · Shipping · Return Policy · Reviews), with the active tab in blue and a blue underline. Description uses bullets.
- **Also below:** a "Frequently Bought Together" row and a "You May Also Like" product row.
- **Mobile:**
  - Back and share header, swipeable image with dots.
  - Full-width blue "Add to Cart" and a blue-outline "Buy Now" stacked, plus a sticky bottom purchase bar when scrolled.

### 4. Cart
- Title "Your Cart (3)" with a "Clear Cart" link on the right.
- **Left column:** item rows inside a white card, each with a thumbnail (`surface` well), name, variant, price, quantity stepper, line total and a remove (trash) icon; rows are separated by dividers.
- **Right column:** an "Order Summary" card.
  - Lines: Subtotal, Discount (green, negative), Coupon, Shipping ("Free" in green), Tax.
  - Bold **Total**.
  - Full-width blue **"Proceed to Checkout"**.
  - Below it, a coupon input with an "Apply" button and the available-coupon chips.
  - Free-shipping progress bar.
- Below both columns: a "You May Also Like" row.
- Empty state: an illustration-style icon, "Your cart is empty" and a blue "Continue Shopping" button.

### 5. Checkout
- **Top stepper:** numbered circles connected by lines — **Cart → Address → Payment → Success**.
  - Completed steps: blue with a check.
  - Current step: solid blue number.
  - Upcoming steps: grey outline.
  - The existing four internal steps (Contact, Shipping, Review, Payment) map onto Address and Payment.
- **Left cards:**
  - **Customer Information:** "Already have an account? Login" note, then Full Name, Email and Phone fields.
  - **Shipping Address:** saved-address radio cards with a "Home" chip and Edit/Remove links, plus a "+ Add New Address" link.
  - **Payment Method:** radio cards — "Razorpay (Cards, UPI, Net Banking, Wallets)" and "Cash on Delivery (Pay when you receive)".
- **Right:** a sticky **Order Summary** card with item thumbnails and quantities, Subtotal / Discount / Shipping / Tax, a bold Total, and a full-width blue "Proceed to Payment" / "Place Order" button.
- **Success page:** a large blue check circle, the order number, a summary card, and "Track Order" (blue) plus "Continue Shopping" (outline) buttons.

### 7. Admin dashboard
- **Sidebar:** full height, dark `ink-900`.
  - Top: `Logo tone="light"` with "Admin" subtitle.
  - Nav items: white/70 text with icons — Dashboard, Products, Categories, Brands, Orders, Customers, Reviews, Coupons, Payments, Analytics, Inventory, Settings, then Logout at the bottom.
  - **Active item:** solid `brand-500` pill with white text.
  - Hover: white/10 background.
- **Top bar:** white with a bottom border.
  - Left: page title or breadcrumb, and a search input ("Search products, orders…").
  - Right: notification bell and admin avatar with "Admin ▾".
- **Content:** `surface` background.
- **Row of 4 stat cards:** Total Revenue, Orders, Customers, Products. Each is a white card with a small grey label, a big bold value, a green "↑ 12%" (or red for negative) change, and an icon in a light-blue rounded square. Low stock and pending orders can appear as a second row or as smaller cards.
- **Charts:**
  - "Revenue Overview": blue line with a light-blue area fill and month/day axis, about 2/3 of the width.
  - "Order Status": **donut chart** in blue shades plus amber and red, with a legend listing Delivered / Processing / Shipped / Pending / Cancelled and their percentages, about 1/3 of the width.
- **Bottom:**
  - "Top Products" table: image, name, sold count, revenue.
  - "Recent Orders" table: Order ID, Customer, Status badge, Amount, Date.

### 9. Admin — Product management
- Title "Products" with a solid blue **"+ Add Product"** button on the right.
- **Filter row:** search, category, status and stock filters.
- **Table:** white card, `surface` header row. Columns: Image (40px thumbnail), Name, Price, Stock, Status (green "Published" / grey "Draft" pill), Actions (edit pencil and delete trash icon buttons).
- Pagination at the bottom right; the active page is blue.

### 10. Admin — Orders management
- Title "Orders".
- **Filter row:** "All Status" select, "All Payment" select, and a search box ("Search by order ID").
- **Table columns:** Order ID (bold), Customer, Amount, Status pill, Payment pill, Date.
  - Status colours: Delivered green, Processing blue, Pending amber, Cancelled red.
  - Payment colours: Paid green, COD/Pending grey or amber.
- Pagination below.
- The other admin pages (categories, brands, inventory, customers, reviews, coupons, payments, analytics, settings, order detail, product form) use the same table and card language.

### 8. Mobile
- Every page is designed mobile-first:
  - 16px side padding and 44px touch targets.
  - Horizontally scrolling category tiles.
  - 2-column product grid with full-width Add to Cart buttons.
  - Bottom nav.
  - Sticky CTAs on product, cart and checkout.
  - Filter drawer.
- The admin panel collapses its sidebar into a drawer (hamburger in the top bar), and wide tables scroll horizontally inside their card.
