const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inrPrecise = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat('en-IN', { notation: 'compact', maximumFractionDigits: 1 });

/** ₹1,299 (whole rupees) or ₹1,299.50 when `precise` or the value has paise. */
export const formatPrice = (value, { precise = false } = {}) => {
  const n = Number(value) || 0;
  return precise || !Number.isInteger(n) ? inrPrecise.format(n) : inr.format(n);
};

export const formatCompact = (value) => compact.format(Number(value) || 0);

export const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(Number(value) || 0);

export const formatDate = (value, opts = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  value ? new Intl.DateTimeFormat('en-IN', opts).format(new Date(value)) : '—';

export const formatDateTime = (value) =>
  formatDate(value, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export const formatRelative = (value) => {
  if (!value) return '';
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return 'just now';
};

export const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

export const titleCase = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** "Gunjur Lake" → "Near Gunjur Lake"; leaves "Near…"/"Opp…"/"Behind…" untouched. */
export const formatLandmark = (landmark) => {
  const value = String(landmark || '').trim();
  if (!value) return '';
  return /^(near|opp(osite)?\.?|behind|beside|next to|in front of)\b/i.test(value) ? value : `Near ${value}`;
};
