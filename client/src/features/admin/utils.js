/** Admin-only helpers (pure, framework-free). */

export const slugify = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

/** `yyyy-mm-dd` for <input type="date"> in local time. */
export const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** `yyyy-mm-ddThh:mm` for <input type="datetime-local">. */
export const toDateTimeInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${toDateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const daysAgo = (days, from = new Date()) => {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d;
};

export const isConflict = (error) => error?.status === 409;

/** Converts rows to CSV. columns: [{ header, value: (row) => any }] */
export function toCsv(rows, columns) {
  const escape = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => escape(c.header)).join(',')];
  rows.forEach((row) => lines.push(columns.map((c) => escape(c.value(row))).join(',')));
  return lines.join('\r\n');
}

/** Triggers a client-side download of `content`. */
export function downloadFile(filename, content, type = 'text/csv;charset=utf-8') {
  const blob = new Blob(['﻿', content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const pctChange = (value) => (value === null || value === undefined || Number.isNaN(value) ? null : Number(value));

/** Shows "12–24 of 180" for a pagination object. */
export const rangeLabel = (pagination) => {
  if (!pagination?.total) return '';
  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.total, pagination.page * pagination.limit);
  return `${start}–${end} of ${pagination.total}`;
};

/** Stock state from available units and a threshold. */
export const stockState = (available, threshold = 5) => (available <= 0 ? 'out' : available <= threshold ? 'low' : 'in');

/** Coupon lifecycle state derived from dates, flags and usage. */
export function couponState(coupon, now = new Date()) {
  if (!coupon) return 'inactive';
  if (coupon.isExpired || (coupon.expiresAt && new Date(coupon.expiresAt) < now)) return 'expired';
  if (!coupon.isActive) return 'inactive';
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return 'scheduled';
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) return 'exhausted';
  return 'active';
}
