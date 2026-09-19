import { beforeEach, describe, expect, it } from 'vitest';
import { Inventory, Product } from '../src/models/index.js';
import { createProduct, createUser, loginAs } from './helpers.js';

describe('wishlist', () => {
  let agent;
  let product;
  let variants;

  beforeEach(async () => {
    agent = await loginAs(await createUser());
    ({ product, variants } = await createProduct({
      price: 800,
      variants: [
        { size: 'M', stock: 0 },
        { size: 'L', stock: 4 },
      ],
    }));
  });

  it('adds products (no duplicates) and returns ProductCard items', async () => {
    let res = await agent.post('/api/v1/wishlist/items').send({ productId: String(product._id) });
    expect(res.status).toBe(200);
    res = await agent.post('/api/v1/wishlist/items').send({ productId: String(product._id) });
    expect(res.body.data.items).toHaveLength(1);
    const card = res.body.data.items[0].product;
    expect(card).toMatchObject({ _id: String(product._id), name: product.name, slug: product.slug, variantCount: 2 });
    expect(card.brand).toHaveProperty('slug');
    expect(card.category).toHaveProperty('name');
    expect(card.defaultVariantId).toBe(String(variants[0]._id));

    const ids = await agent.get('/api/v1/wishlist/ids');
    expect(ids.body.data).toEqual([String(product._id)]);
  });

  it('hides unpublished products and 404s when adding them', async () => {
    await agent.post('/api/v1/wishlist/items').send({ productId: String(product._id) });
    await Product.updateOne({ _id: product._id }, { $set: { isPublished: false } });
    const res = await agent.get('/api/v1/wishlist');
    expect(res.body.data.items).toHaveLength(0);
    const add = await agent.post('/api/v1/wishlist/items').send({ productId: String(product._id) });
    expect(add.status).toBe(404);
  });

  it('removes and merges items', async () => {
    const { product: other } = await createProduct();
    let res = await agent.post('/api/v1/wishlist/merge').send({ productIds: [String(product._id), String(other._id)] });
    expect(res.body.data.items).toHaveLength(2);
    res = await agent.delete(`/api/v1/wishlist/items/${product._id}`);
    expect(res.body.data.items.map((i) => i.product._id)).toEqual([String(other._id)]);
  });

  it('moves to cart using the first in-stock variant', async () => {
    await agent.post('/api/v1/wishlist/items').send({ productId: String(product._id) });
    const res = await agent.post(`/api/v1/wishlist/items/${product._id}/move-to-cart`).send({});
    expect(res.status).toBe(200);
    expect(res.body.data.cart.items[0].variantId).toBe(String(variants[1]._id));
    expect(res.body.data.wishlist.items).toHaveLength(0);
  });

  it('returns 409 when the chosen variant or the whole product is out of stock', async () => {
    await agent.post('/api/v1/wishlist/items').send({ productId: String(product._id) });
    let res = await agent
      .post(`/api/v1/wishlist/items/${product._id}/move-to-cart`)
      .send({ variantId: String(variants[0]._id) });
    expect(res.status).toBe(409);

    await Inventory.updateMany({ product: product._id }, { $set: { available: 0 } });
    res = await agent.post(`/api/v1/wishlist/items/${product._id}/move-to-cart`).send({});
    expect(res.status).toBe(409);
    const list = await agent.get('/api/v1/wishlist');
    expect(list.body.data.items).toHaveLength(1);
  });
});
