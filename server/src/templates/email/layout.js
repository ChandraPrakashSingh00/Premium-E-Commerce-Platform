import { env } from '../../config/env.js';

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(n) || 0);

export const clientLink = (path = '/') => `${env.clientUrl}${path}`;

export const button = (href, label) => `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px 0">
    <tr><td style="border-radius:10px;background:#086FFD">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 28px;font-weight:600;font-size:15px;color:#ffffff;text-decoration:none;border-radius:10px">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;

export const paragraph = (text) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#374151">${text}</p>`;

/** Shared, table-based (email-client safe) HTML layout. */
export function layout({ title, preheader = '', body, storeName = 'BlueMart' }) {
  const year = new Date().getFullYear();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<span style="display:none!important;opacity:0;height:0;width:0;overflow:hidden">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F7FA;padding:32px 12px">
  <tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px">
      <tr><td style="padding:0 8px 20px">
        <a href="${clientLink('/')}" style="font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#191B1F;text-decoration:none"><span style="color:#086FFD">Blue</span>Mart</a>
      </td></tr>
      <tr><td style="background:#FFFFFF;border:1px solid #E5E7EB;border-radius:16px;padding:36px 32px">
        <h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:#191B1F;letter-spacing:-0.01em">${escapeHtml(title)}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:24px 8px;font-size:12px;line-height:1.6;color:#6B7280">
        You are receiving this email because of activity on your ${escapeHtml(storeName)} account.<br>
        © ${year} ${escapeHtml(storeName)}. All rights reserved.
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Order line-items + totals table. */
export function orderSummary(order) {
  const rows = order.items
    .map(
      (i) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #E5E7EB;font-size:14px;color:#191B1F">
          ${escapeHtml(i.name)}<br><span style="color:#6B7280;font-size:12px">${escapeHtml([i.color, i.size].filter(Boolean).join(' · '))} × ${i.quantity}</span>
        </td>
        <td align="right" style="padding:12px 0;border-bottom:1px solid #E5E7EB;font-size:14px;color:#191B1F;white-space:nowrap">${formatINR(i.lineSubtotal)}</td>
      </tr>`,
    )
    .join('');
  const p = order.pricing;
  const line = (label, value, bold = false) =>
    `<tr><td style="padding:6px 0;font-size:14px;color:${bold ? '#191B1F' : '#6B7280'};${bold ? 'font-weight:700' : ''}">${label}</td><td align="right" style="padding:6px 0;font-size:14px;color:#191B1F;${bold ? 'font-weight:700' : ''}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 24px">
    ${rows}
    ${line('Subtotal', formatINR(p.subtotal))}
    ${p.couponDiscount ? line(`Coupon${order.coupon?.code ? ` (${escapeHtml(order.coupon.code)})` : ''}`, `− ${formatINR(p.couponDiscount)}`) : ''}
    ${line('Tax (GST)', formatINR(p.tax))}
    ${line('Shipping', p.shipping ? formatINR(p.shipping) : 'Free')}
    ${p.codFee ? line('COD fee', formatINR(p.codFee)) : ''}
    ${line('Total', formatINR(p.total), true)}
  </table>`;
}
