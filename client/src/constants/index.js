export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

/** Badge tone per order status. */
export const ORDER_STATUS_TONE = {
  pending: 'warning',
  confirmed: 'brand',
  processing: 'brand',
  packed: 'brand',
  shipped: 'brand',
  out_for_delivery: 'brand',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'neutral',
  refunded: 'neutral',
};

/** Happy-path order timeline used by the tracking UI. */
export const ORDER_TIMELINE = ['confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

export const PAYMENT_STATUS_TONE = {
  pending: 'warning',
  paid: 'success',
  failed: 'danger',
  refunded: 'neutral',
  partially_refunded: 'neutral',
};

export const PAYMENT_METHOD_LABELS = { razorpay: 'Online (Razorpay)', cod: 'Cash on Delivery' };

export const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'best-selling', label: 'Best Selling' },
];

export const INDIAN_STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

export const MAX_QTY_PER_ITEM = 10;
