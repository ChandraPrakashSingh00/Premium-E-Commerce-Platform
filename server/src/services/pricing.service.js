import { Brand, Inventory, Product, ProductVariant } from '../models/index.js';
import { MAX_QTY_PER_ITEM } from '../models/CartItem.js';
import { AppError } from '../utils/AppError.js';
import { roundMoney } from '../utils/helpers.js';
import { couponService } from './coupon.service.js';
import { settingsService } from './settings.service.js';

/**
 * THE single source of truth for money. Every cart, quote and order total is
 * produced here from current catalogue data – client-supplied prices are never used.
 */

const uniqueIds = (values) => [...new Map(values.filter(Boolean).map((v) => [String(v), v])).values()];

const hide = (obj, key, value) => Object.defineProperty(obj, key, { value, enumerable: false, writable: true });

function unavailableItem(line, variant, product) {
  return {
    _id: line._id,
    productId: product?._id ?? variant?.product ?? null,
    variantId: line.variantId,
    name: product?.name ?? 'Unavailable product',
    slug: product?.slug ?? '',
    image: product?.thumbnail ?? '',
    brandName: '',
    sku: variant?.sku ?? '',
    size: variant?.size,
    color: variant?.color,
    price: variant?.price ?? 0,
    compareAtPrice: variant?.compareAtPrice ?? 0,
    quantity: line.quantity,
    maxQuantity: 0,
    stock: 0,
    inStock: false,
    lineSubtotal: 0,
    issue: 'unavailable',
  };
}

/** Splits `amount` across lines proportionally to their subtotal; last line takes the remainder. */
function allocate(amount, lines) {
  const base = lines.reduce((s, l) => s + l.lineSubtotal, 0);
  let remaining = amount;
  return lines.map((l, i) => {
    if (i === lines.length - 1) return roundMoney(Math.max(0, remaining));
    const share = base > 0 ? roundMoney((amount * l.lineSubtotal) / base) : 0;
    const bounded = Math.min(share, l.lineSubtotal, remaining);
    remaining = roundMoney(remaining - bounded);
    return bounded;
  });
}

export const pricingService = {
  allocate,

  /**
   * @param {{ lines: Array<{_id:any, variantId:any, quantity:number}>, couponCode?: string|null,
   *           userId?: any, paymentMethod?: 'razorpay'|'cod' }} input
   * @returns {Promise<object>} CartView (+ non-enumerable `lines` with OrderItem snapshots and `couponId`)
   */
  async buildCartView({ lines = [], couponCode = null, userId = null, paymentMethod } = {}) {
    const settings = await settingsService.get();
    const variantIds = uniqueIds(lines.map((l) => l.variantId));

    const [variants, inventories] = variantIds.length
      ? await Promise.all([
          ProductVariant.find({ _id: { $in: variantIds } })
            .select('product sku price compareAtPrice size color images isActive')
            .lean(),
          Inventory.find({ variant: { $in: variantIds } }).select('variant available').lean(),
        ])
      : [[], []];
    const productIds = uniqueIds(variants.map((v) => v.product));
    const products = productIds.length
      ? await Product.find({ _id: { $in: productIds } })
          .select('name slug thumbnail images brand taxRate isPublished')
          .lean()
      : [];
    const brandIds = uniqueIds(products.map((p) => p.brand));
    const brands = brandIds.length ? await Brand.find({ _id: { $in: brandIds } }).select('name').lean() : [];

    const variantMap = new Map(variants.map((v) => [String(v._id), v]));
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    const brandMap = new Map(brands.map((b) => [String(b._id), b.name]));
    const stockMap = new Map(inventories.map((i) => [String(i.variant), i.available]));

    const items = [];
    const eligible = [];
    for (const line of lines) {
      const variant = variantMap.get(String(line.variantId));
      const product = variant && productMap.get(String(variant.product));
      if (!variant || !product || !product.isPublished || !variant.isActive) {
        items.push(unavailableItem(line, variant, product));
        continue;
      }
      const available = Math.max(0, stockMap.get(String(variant._id)) ?? 0);
      const quantity = line.quantity;
      let issue = null;
      if (available <= 0) issue = 'out_of_stock';
      else if (quantity > available) issue = 'insufficient_stock';

      const price = roundMoney(variant.price);
      const compareAtPrice = roundMoney(variant.compareAtPrice || 0);
      const lineSubtotal = roundMoney(price * quantity);
      const item = {
        _id: line._id,
        productId: product._id,
        variantId: variant._id,
        name: product.name,
        slug: product.slug,
        image: variant.images?.[0]?.url || product.thumbnail || product.images?.[0]?.url || '',
        brandName: brandMap.get(String(product.brand)) ?? '',
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        price,
        compareAtPrice,
        quantity,
        maxQuantity: Math.min(MAX_QTY_PER_ITEM, available),
        stock: available,
        inStock: available > 0,
        lineSubtotal,
        issue,
      };
      items.push(item);
      if (issue !== 'out_of_stock') eligible.push({ item, taxRate: product.taxRate ?? 0 });
    }

    const subtotal = roundMoney(eligible.reduce((s, e) => s + e.item.lineSubtotal, 0));
    const discount = roundMoney(
      eligible.reduce((s, { item }) => s + Math.max(0, item.compareAtPrice - item.price) * item.quantity, 0),
    );
    const itemCount = eligible.reduce((s, e) => s + e.item.quantity, 0);

    let coupon = null;
    let couponDoc = null;
    let couponError = null;
    let couponDiscount = 0;
    if (couponCode && eligible.length) {
      try {
        const result = await couponService.validateForUser(couponCode, { userId, subtotal });
        couponDoc = result.coupon;
        couponDiscount = Math.min(result.discountAmount, subtotal);
        coupon = {
          code: couponDoc.code,
          description: couponDoc.description,
          discountType: couponDoc.discountType,
          discountValue: couponDoc.discountValue,
          discountAmount: couponDiscount,
        };
      } catch (err) {
        if (!(err instanceof AppError)) throw err;
        couponError = err.message;
      }
    }

    const shares = allocate(couponDiscount, eligible.map((e) => e.item));
    const orderLines = eligible.map(({ item, taxRate }, i) => {
      const discountAmount = shares[i];
      const taxAmount = roundMoney(((item.lineSubtotal - discountAmount) * taxRate) / 100);
      return {
        product: item.productId,
        variant: item.variantId,
        name: item.name,
        slug: item.slug,
        image: item.image,
        sku: item.sku,
        size: item.size,
        color: item.color,
        brandName: item.brandName,
        price: item.price,
        compareAtPrice: item.compareAtPrice,
        quantity: item.quantity,
        taxRate,
        lineSubtotal: item.lineSubtotal,
        discountAmount,
        taxAmount,
        lineTotal: roundMoney(item.lineSubtotal - discountAmount + taxAmount),
      };
    });

    const tax = roundMoney(orderLines.reduce((s, l) => s + l.taxAmount, 0));
    const afterCoupon = roundMoney(subtotal - couponDiscount);
    const hasItems = eligible.length > 0;
    const shipping = !hasItems || afterCoupon >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
    const codFee = hasItems && paymentMethod === 'cod' ? settings.codFee : 0;
    const total = roundMoney(afterCoupon + tax + shipping + codFee);

    const view = {
      items,
      summary: {
        itemCount,
        subtotal,
        discount,
        couponDiscount,
        tax,
        shipping,
        codFee,
        total,
        freeShippingThreshold: settings.freeShippingThreshold,
        amountToFreeShipping: roundMoney(Math.max(0, settings.freeShippingThreshold - afterCoupon)),
      },
      coupon,
      couponError,
      hasIssues: items.some((i) => i.issue !== null),
    };
    hide(view, 'lines', orderLines);
    hide(view, 'couponId', couponDoc?._id ?? null);
    return view;
  },
};
