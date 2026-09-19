import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app, createAdmin, createProduct, createUser, loginAs } from './helpers.js';
import { Order, Product, Review } from '../src/models/index.js';
import { settingsService } from '../src/services/settings.service.js';

const api = request(app);
let orderSeq = 0;

async function createOrder(user, product, variant, status = 'delivered') {
  orderSeq += 1;
  return Order.create({
    orderNumber: `ORD-REV-${orderSeq}`,
    user: user._id,
    items: [
      { product: product._id, variant: variant._id, name: product.name, slug: product.slug, sku: variant.sku, price: 1000, quantity: 1, lineSubtotal: 1000, lineTotal: 1000 },
    ],
    contact: { name: user.name, email: user.email, phone: '9876543210' },
    shippingAddress: { fullName: user.name, phone: '9876543210', addressLine1: '1 MG Road', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' },
    pricing: { subtotal: 1000, total: 1000 },
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    status,
  });
}

const reviewBody = (productId, overrides = {}) => ({
  productId: String(productId),
  rating: 4,
  title: 'Solid purchase',
  comment: 'Fits well and the fabric feels premium.',
  ...overrides,
});

describe('reviews', () => {
  let product;
  let variant;
  let buyer;
  let buyerAgent;

  beforeEach(async () => {
    ({ product, variants: [variant] } = await createProduct());
    buyer = await createUser();
    buyerAgent = await loginAs(buyer);
  });

  it('blocks customers without a delivered order', async () => {
    const res = await buyerAgent.post('/api/v1/reviews').send(reviewBody(product._id));
    expect(res.status).toBe(403);

    await createOrder(buyer, product, variant, 'shipped');
    const shipped = await buyerAgent.post('/api/v1/reviews').send(reviewBody(product._id));
    expect(shipped.status).toBe(403);

    const elig = await buyerAgent.get(`/api/v1/reviews/eligibility/${product._id}`);
    expect(elig.body.data).toEqual({ canReview: false, reason: 'not_purchased' });

    expect((await api.post('/api/v1/reviews').send(reviewBody(product._id))).status).toBe(401);
    expect((await buyerAgent.post('/api/v1/reviews').send(reviewBody(product._id, { rating: 9 }))).status).toBe(422);
  });

  it('lets a delivered buyer review once; moderation then approval updates rating', async () => {
    const order = await createOrder(buyer, product, variant);
    expect((await buyerAgent.get(`/api/v1/reviews/eligibility/${product._id}`)).body.data.canReview).toBe(true);

    const res = await buyerAgent.post('/api/v1/reviews').send(reviewBody(product._id, { rating: 5 }));
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'pending', isVerifiedPurchase: true, order: String(order._id) });
    expect((await Order.findById(order._id)).items[0].isReviewed).toBe(true);

    const dup = await buyerAgent.post('/api/v1/reviews').send(reviewBody(product._id));
    expect(dup.status).toBe(409);
    const elig = await buyerAgent.get(`/api/v1/reviews/eligibility/${product._id}`);
    expect(elig.body.data).toMatchObject({ canReview: false, reason: 'already_reviewed' });

    // Pending reviews are hidden and do not count.
    let list = await api.get(`/api/v1/reviews/product/${product._id}`);
    expect(list.body.data.items).toHaveLength(0);
    expect((await Product.findById(product._id)).reviewCount).toBe(0);

    const admin = await loginAs(await createAdmin());
    const queue = await admin.get('/api/v1/admin/reviews?status=pending');
    expect(queue.body.data.items).toHaveLength(1);
    expect(queue.body.data.items[0].user).toMatchObject({ email: buyer.email });

    const approved = await admin.patch(`/api/v1/admin/reviews/${res.body.data._id}`).send({ status: 'approved', adminReply: 'Thank you!' });
    expect(approved.status).toBe(200);
    let p = await Product.findById(product._id).lean();
    expect(p).toMatchObject({ ratingAverage: 5, reviewCount: 1 });
    expect(p.ratingBreakdown[5]).toBe(1);

    // A second approved review (moderation disabled) averages to 1 decimal.
    await settingsService.update({ requireReviewModeration: false });
    const other = await createUser();
    await createOrder(other, product, variant);
    const otherAgent = await loginAs(other);
    const second = await otherAgent.post('/api/v1/reviews').send(reviewBody(product._id, { rating: 2 }));
    expect(second.body.data.status).toBe('approved');
    p = await Product.findById(product._id).lean();
    expect(p).toMatchObject({ ratingAverage: 3.5, reviewCount: 2 });

    list = await api.get(`/api/v1/reviews/product/${product._id}?sort=rating-low`);
    expect(list.body.data.items.map((r) => r.rating)).toEqual([2, 5]);
    expect(list.body.data.items[0].user).toEqual({ name: other.name, avatar: null });
    expect(list.body.data.items[1].adminReply).toBe('Thank you!');
    expect(list.body.data.meta.summary).toMatchObject({ average: 3.5, count: 2 });

    // Owner delete recalculates and re-opens eligibility.
    expect((await otherAgent.delete(`/api/v1/reviews/${second.body.data._id}`)).status).toBe(200);
    expect((await buyerAgent.delete(`/api/v1/reviews/${second.body.data._id}`)).status).toBe(404);
    p = await Product.findById(product._id).lean();
    expect(p).toMatchObject({ ratingAverage: 5, reviewCount: 1 });
  });

  it('owner edits go back to pending when moderated', async () => {
    await createOrder(buyer, product, variant);
    await Review.create({ product: product._id, user: buyer._id, rating: 5, title: 'Great', comment: 'Absolutely great product', status: 'approved' });
    const review = await Review.findOne({ user: buyer._id });
    const intruder = await loginAs(await createUser());
    expect((await intruder.patch(`/api/v1/reviews/${review._id}`).send({ rating: 1 })).status).toBe(403);

    const res = await buyerAgent.patch(`/api/v1/reviews/${review._id}`).send({ rating: 3 });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ rating: 3, status: 'pending' });
    expect((await Product.findById(product._id)).reviewCount).toBe(0);
  });

  it('toggles helpful votes atomically and reports isHelpful', async () => {
    const author = await createUser();
    const review = await Review.create({
      product: product._id,
      user: author._id,
      rating: 4,
      title: 'Nice',
      comment: 'Nice product overall, would buy again.',
      status: 'approved',
    });

    const own = await loginAs(author);
    expect((await own.post(`/api/v1/reviews/${review._id}/helpful`)).status).toBe(400);

    const first = await buyerAgent.post(`/api/v1/reviews/${review._id}/helpful`);
    expect(first.body.data).toEqual({ helpfulCount: 1, isHelpful: true });

    const listed = await buyerAgent.get(`/api/v1/reviews/product/${product._id}`);
    expect(listed.body.data.items[0].isHelpful).toBe(true);
    const anon = await api.get(`/api/v1/reviews/product/${product._id}`);
    expect(anon.body.data.items[0].isHelpful).toBe(false);
    expect(anon.body.data.items[0].helpfulBy).toBeUndefined();

    const second = await buyerAgent.post(`/api/v1/reviews/${review._id}/helpful`);
    expect(second.body.data).toEqual({ helpfulCount: 0, isHelpful: false });

    // Concurrent toggles from different users never double count.
    const voters = await Promise.all([createUser(), createUser(), createUser()]);
    const agents = await Promise.all(voters.map((u) => loginAs(u)));
    await Promise.all(agents.map((a) => a.post(`/api/v1/reviews/${review._id}/helpful`)));
    expect((await Review.findById(review._id)).helpfulCount).toBe(3);
  });

  it('requires images for upload and admin can delete reviews', async () => {
    const res = await buyerAgent.post('/api/v1/reviews/images');
    expect(res.status).toBe(400);

    await createOrder(buyer, product, variant);
    await settingsService.update({ requireReviewModeration: false });
    const created = await buyerAgent.post('/api/v1/reviews').send(reviewBody(product._id));
    const admin = await loginAs(await createAdmin());
    expect((await admin.delete(`/api/v1/admin/reviews/${created.body.data._id}`)).status).toBe(200);
    expect((await Product.findById(product._id)).reviewCount).toBe(0);
    const order = await Order.findOne({ user: buyer._id });
    expect(order.items[0].isReviewed).toBe(false);
  });
});
