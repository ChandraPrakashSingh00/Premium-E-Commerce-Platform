import { button, clientLink, escapeHtml, formatINR, layout, orderSummary, paragraph } from './layout.js';

const orderLink = (order) => clientLink(`/account/orders/${order._id}`);

/**
 * Each template returns { subject, html, text }.
 * Data is always escaped before being placed into HTML.
 */
export const emailTemplates = {
  welcome: ({ name, storeName }) => ({
    subject: `Welcome to ${storeName}`,
    html: layout({
      storeName,
      title: `Welcome, ${name}`,
      preheader: 'Your account is ready.',
      body:
        paragraph(`Thanks for joining ${escapeHtml(storeName)}. Discover curated essentials, exclusive drops and members-only offers.`) +
        button(clientLink('/shop'), 'Start shopping'),
    }),
    text: `Welcome to ${storeName}, ${name}! Start shopping: ${clientLink('/shop')}`,
  }),

  emailVerification: ({ name, storeName, token }) => {
    const url = clientLink(`/verify-email?token=${encodeURIComponent(token)}`);
    return {
      subject: 'Verify your email address',
      html: layout({
        storeName,
        title: 'Confirm your email',
        preheader: 'One quick step to secure your account.',
        body:
          paragraph(`Hi ${escapeHtml(name)}, please confirm this is your email address. The link expires in 24 hours.`) +
          button(url, 'Verify email') +
          paragraph(`<span style="font-size:13px;color:#6B7280">If the button does not work, paste this link into your browser:<br>${escapeHtml(url)}</span>`),
      }),
      text: `Verify your email: ${url}`,
    };
  },

  passwordReset: ({ name, storeName, token }) => {
    const url = clientLink(`/reset-password/${encodeURIComponent(token)}`);
    return {
      subject: 'Reset your password',
      html: layout({
        storeName,
        title: 'Reset your password',
        preheader: 'This link expires in 30 minutes.',
        body:
          paragraph(`Hi ${escapeHtml(name)}, we received a request to reset your password. This link expires in 30 minutes.`) +
          button(url, 'Choose a new password') +
          paragraph('If you did not request this, you can safely ignore this email — your password will not change.'),
      }),
      text: `Reset your password: ${url} (expires in 30 minutes)`,
    };
  },

  orderConfirmation: ({ order, storeName }) => ({
    subject: `Order ${order.orderNumber} confirmed`,
    html: layout({
      storeName,
      title: 'Thank you for your order',
      preheader: `We've received order ${order.orderNumber}.`,
      body:
        paragraph(`Hi ${escapeHtml(order.contact.name)}, your order <strong>${escapeHtml(order.orderNumber)}</strong> has been confirmed. We'll let you know when it ships.`) +
        orderSummary(order) +
        paragraph(`<strong>Payment:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid online'}`) +
        button(orderLink(order), 'View order'),
    }),
    text: `Order ${order.orderNumber} confirmed. Total ${formatINR(order.pricing.total)}. ${orderLink(order)}`,
  }),

  paymentConfirmation: ({ order, storeName }) => ({
    subject: `Payment received for ${order.orderNumber}`,
    html: layout({
      storeName,
      title: 'Payment received',
      preheader: `${formatINR(order.pricing.total)} received.`,
      body:
        paragraph(`We've received your payment of <strong>${formatINR(order.pricing.total)}</strong> for order ${escapeHtml(order.orderNumber)}.`) +
        button(orderLink(order), 'View order'),
    }),
    text: `Payment of ${formatINR(order.pricing.total)} received for ${order.orderNumber}.`,
  }),

  paymentFailed: ({ order, storeName }) => ({
    subject: `Payment failed for ${order.orderNumber}`,
    html: layout({
      storeName,
      title: 'Your payment did not go through',
      body:
        paragraph(`The payment for order ${escapeHtml(order.orderNumber)} failed. Your items are reserved for a limited time — you can retry the payment from your order page.`) +
        button(orderLink(order), 'Retry payment'),
    }),
    text: `Payment failed for ${order.orderNumber}. Retry: ${orderLink(order)}`,
  }),

  orderShipped: ({ order, storeName }) => ({
    subject: `Your order ${order.orderNumber} has shipped`,
    html: layout({
      storeName,
      title: 'Your order is on its way',
      body:
        paragraph(`Good news! Order ${escapeHtml(order.orderNumber)} has shipped${order.tracking?.carrier ? ` with ${escapeHtml(order.tracking.carrier)}` : ''}.`) +
        (order.tracking?.trackingNumber ? paragraph(`<strong>Tracking number:</strong> ${escapeHtml(order.tracking.trackingNumber)}`) : '') +
        button(order.tracking?.trackingUrl || orderLink(order), 'Track order'),
    }),
    text: `Order ${order.orderNumber} shipped. Track: ${order.tracking?.trackingUrl || orderLink(order)}`,
  }),

  orderDelivered: ({ order, storeName }) => ({
    subject: `Delivered: ${order.orderNumber}`,
    html: layout({
      storeName,
      title: 'Your order has been delivered',
      body:
        paragraph(`Order ${escapeHtml(order.orderNumber)} was delivered. We hope you love it — share your thoughts with a review.`) +
        button(orderLink(order), 'Write a review'),
    }),
    text: `Order ${order.orderNumber} delivered.`,
  }),

  orderCancelled: ({ order, storeName }) => ({
    subject: `Order ${order.orderNumber} cancelled`,
    html: layout({
      storeName,
      title: 'Your order was cancelled',
      body:
        paragraph(`Order ${escapeHtml(order.orderNumber)} has been cancelled${order.cancellation?.reason ? `: ${escapeHtml(order.cancellation.reason)}` : '.'}`) +
        (order.paymentStatus === 'paid' || order.refund?.status === 'pending'
          ? paragraph('Since this order was paid online, a refund has been initiated to your original payment method.')
          : '') +
        button(orderLink(order), 'View order'),
    }),
    text: `Order ${order.orderNumber} cancelled.`,
  }),

  refund: ({ order, storeName }) => ({
    subject: `Refund processed for ${order.orderNumber}`,
    html: layout({
      storeName,
      title: 'Your refund is on its way',
      body:
        paragraph(`A refund of <strong>${formatINR(order.refund?.amount)}</strong> for order ${escapeHtml(order.orderNumber)} has been processed. It usually reflects in 5–7 business days.`) +
        button(orderLink(order), 'View order'),
    }),
    text: `Refund of ${formatINR(order.refund?.amount)} processed for ${order.orderNumber}.`,
  }),

  orderStatus: ({ order, storeName, statusLabel }) => ({
    subject: `Order ${order.orderNumber}: ${statusLabel}`,
    html: layout({
      storeName,
      title: `Order update: ${statusLabel}`,
      body: paragraph(`Your order ${escapeHtml(order.orderNumber)} is now <strong>${escapeHtml(statusLabel)}</strong>.`) + button(orderLink(order), 'View order'),
    }),
    text: `Order ${order.orderNumber} is now ${statusLabel}.`,
  }),

  returnUpdate: ({ order, storeName }) => ({
    subject: `Return ${order.returnRequest?.status} for ${order.orderNumber}`,
    html: layout({
      storeName,
      title: `Return ${escapeHtml(order.returnRequest?.status)}`,
      body:
        paragraph(`Your return request for order ${escapeHtml(order.orderNumber)} is <strong>${escapeHtml(order.returnRequest?.status)}</strong>.`) +
        (order.returnRequest?.adminNote ? paragraph(escapeHtml(order.returnRequest.adminNote)) : '') +
        button(orderLink(order), 'View order'),
    }),
    text: `Return ${order.returnRequest?.status} for ${order.orderNumber}.`,
  }),
};
