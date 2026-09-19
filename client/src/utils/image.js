/**
 * Returns a resized image URL for known CDNs (Cloudinary, Unsplash);
 * other URLs are returned unchanged.
 */
export function imageUrl(input, width = 800) {
  const url = typeof input === 'string' ? input : input?.url;
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/upload/f_auto')) {
    return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_limit/`);
  }
  if (url.includes('images.unsplash.com')) {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    u.searchParams.set('q', '75');
    return u.toString();
  }
  return url;
}

export const srcSet = (input, widths = [320, 480, 640, 960, 1280]) => {
  const url = typeof input === 'string' ? input : input?.url;
  return url && (url.includes('res.cloudinary.com') || url.includes('images.unsplash.com'))
    ? widths.map((w) => `${imageUrl(url, w)} ${w}w`).join(', ')
    : undefined;
};

export const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#F5F7FA"/><path d="M170 270l30-36 30 36 20-24 40 48H110z" fill="#D1D5DB"/><circle cx="165" cy="215" r="14" fill="#D1D5DB"/></svg>',
  );
