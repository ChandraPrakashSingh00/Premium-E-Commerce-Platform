/** Demo reviewers (all use the demo customer password). */
export const reviewers = [
  { name: 'Ananya Iyer', email: 'ananya.iyer@example.com', phone: '9820011223', city: 'Mumbai', state: 'Maharashtra', postalCode: '400050' },
  { name: 'Rohan Mehta', email: 'rohan.mehta@example.com', phone: '9811122334', city: 'New Delhi', state: 'Delhi', postalCode: '110017' },
  { name: 'Kavya Reddy', email: 'kavya.reddy@example.com', phone: '9845033445', city: 'Hyderabad', state: 'Telangana', postalCode: '500034' },
  { name: 'Arjun Nair', email: 'arjun.nair@example.com', phone: '9895044556', city: 'Kochi', state: 'Kerala', postalCode: '682020' },
  { name: 'Ishita Banerjee', email: 'ishita.banerjee@example.com', phone: '9830055667', city: 'Kolkata', state: 'West Bengal', postalCode: '700019' },
];

/**
 * Review copy grouped by top-level category slug. `default` is used for any
 * category without its own list.
 */
export const reviewTexts = {
  men: [
    { rating: 5, title: 'Fits exactly as expected', comment: 'Ordered my usual size and the fit is spot on. The fabric is soft, has a nice weight to it and has survived four washes without shrinking or fading.' },
    { rating: 4, title: 'Great everyday piece', comment: 'Looks sharp with both jeans and chinos. Stitching is neat. Knocked off a star only because the sleeves run slightly long for me.' },
    { rating: 5, title: 'Better than high-street brands', comment: 'The quality is noticeably better than what I usually buy at the mall for the same price. Colour is exactly like the photos.' },
  ],
  women: [
    { rating: 5, title: 'Absolutely love it', comment: 'The fabric drapes beautifully and the colour is even richer in person. Got so many compliments at a family function.' },
    { rating: 4, title: 'Lovely, runs a little large', comment: 'Beautiful finish and very comfortable for long hours. I would suggest going one size down if you are between sizes.' },
    { rating: 5, title: 'Elegant and comfortable', comment: 'Wore it to the office and to dinner the same day. Breathable, does not crease easily and the packaging was lovely too.' },
  ],
  footwear: [
    { rating: 5, title: 'Super comfortable from day one', comment: 'No break-in period needed. I walk about 8 km a day and my feet feel fresh. Grip is excellent even on wet tiles.' },
    { rating: 4, title: 'Stylish and light', comment: 'Very light and the cushioning is great. The toe box is a bit narrow, so wide-footed folks may want to size up.' },
    { rating: 5, title: 'Worth every rupee', comment: 'Build quality feels premium and the sole has held up well after two months of daily use. Delivery was quick as well.' },
  ],
  electronics: [
    { rating: 5, title: 'Excellent sound and battery', comment: 'Bass is punchy without drowning the vocals, and the battery easily lasts my whole work week. Pairing with my phone and laptop was instant.' },
    { rating: 4, title: 'Great value for money', comment: 'Performs as advertised and the companion app is simple to use. The case feels a little plasticky but that is a minor nitpick.' },
    { rating: 5, title: 'Premium feel', comment: 'Solid build, clean design and the noise cancellation makes my commute so much calmer. Charging is quick too.' },
    { rating: 3, title: 'Good, but not perfect', comment: 'Works well overall. Connectivity dropped a couple of times in a crowded metro, though a firmware update seems to have helped.' },
  ],
  'home-living': [
    { rating: 5, title: 'Makes the room feel premium', comment: 'Looks far more expensive than it is. The finish is flawless and it arrived very well packed with zero damage.' },
    { rating: 4, title: 'Beautiful and practical', comment: 'Exactly as pictured and sturdy. The colour is slightly warmer than the photos, which I actually prefer.' },
  ],
  beauty: [
    { rating: 5, title: 'My new favourite', comment: 'Lightweight, absorbs quickly and does not break me out. My skin feels noticeably softer after two weeks of use.' },
    { rating: 4, title: 'Lovely fragrance, lasts well', comment: 'The scent is sophisticated without being overpowering and lasts around six hours on me. The bottle looks gorgeous on my dresser.' },
  ],
  accessories: [
    { rating: 5, title: 'Classy and well made', comment: 'The finishing is excellent and it feels solid in hand. Pairs well with both formal and casual outfits.' },
    { rating: 4, title: 'Great gift option', comment: 'Bought this as a gift and it was very well received. Premium box, neat detailing. Would buy again.' },
  ],
  'sports-fitness': [
    { rating: 5, title: 'Perfect for home workouts', comment: 'Good grip, no slipping even during sweaty sessions, and it does not have the chemical smell cheaper ones have.' },
    { rating: 4, title: 'Solid quality', comment: 'Does exactly what it should. Sturdy and easy to store. Would have liked a carry strap in the box.' },
  ],
  bags: [
    { rating: 5, title: 'Fits everything I need', comment: 'My 15-inch laptop, charger, lunch box and a water bottle all fit with room to spare. The straps are well padded.' },
    { rating: 4, title: 'Smart and durable', comment: 'The material feels tough and wipes clean easily. Zips are smooth. Just wish it had one more outer pocket.' },
  ],
  default: [
    { rating: 5, title: 'Highly recommended', comment: 'Great quality, quick delivery and exactly as described. Will definitely order from BlueMart again.' },
    { rating: 4, title: 'Happy with the purchase', comment: 'Good product for the price and the packaging was excellent. Customer support answered my query within the hour.' },
  ],
};
