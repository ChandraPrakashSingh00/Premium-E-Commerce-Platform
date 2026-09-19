const trimSlash = (v) => String(v || '').replace(/\/$/, '');

export const config = Object.freeze({
  // Production builds without VITE_API_URL expect the API to be proxied on the same origin.
  apiUrl: trimSlash(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/v1' : 'http://localhost:5000/api/v1')),
  siteUrl: trimSlash(import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')),
  siteName: import.meta.env.VITE_SITE_NAME || 'BlueMart',
  isProd: import.meta.env.PROD,
});
