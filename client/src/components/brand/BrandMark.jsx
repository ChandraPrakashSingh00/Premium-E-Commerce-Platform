import { useId } from 'react';

/**
 * BlueMart symbol: shopping bag with a "B" and motion lines.
 * Pure SVG so it stays crisp at any size (navbar, favicon, loaders).
 */
export function BrandMark({ size = 36, className, title }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={`bm-bag-${uid}`} x1="18" y1="18" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2A84FF" />
          <stop offset="1" stopColor="#0660E0" />
        </linearGradient>
      </defs>
      {/* motion lines */}
      <rect x="3" y="27" width="15" height="4" rx="2" fill="#4F9BFF" />
      <rect x="0" y="34" width="17" height="4" rx="2" fill="#2A84FF" />
      <rect x="5" y="41" width="12" height="4" rx="2" fill="#4F9BFF" />
      {/* handle */}
      <path d="M28 22v-4.5a8 8 0 0 1 16 0V22" fill="none" stroke="#086FFD" strokeWidth="4" strokeLinecap="round" />
      {/* bag side */}
      <path d="M50 21.5 57 25a2 2 0 0 1 1.1 1.6L60 53.6a2 2 0 0 1-1.3 2L53 58Z" fill="#0550C4" />
      {/* bag body */}
      <path d="M21.4 20h29.2a2.5 2.5 0 0 1 2.5 2.3l2.4 32.9a2.6 2.6 0 0 1-2.6 2.8H19.1a2.6 2.6 0 0 1-2.6-2.8l2.4-32.9a2.5 2.5 0 0 1 2.5-2.3Z" fill={`url(#bm-bag-${uid})`} />
      {/* B */}
      <path
        fillRule="evenodd"
        fill="#FFFFFF"
        fillOpacity="0.95"
        d="M29 28h9.4c4.6 0 7.4 2.3 7.4 5.9 0 2.3-1.2 4-3.2 4.8 2.7.7 4.4 2.8 4.4 5.6 0 4.1-3.1 6.7-8.1 6.7H29Zm5.4 4.6v4.6h3.2c1.6 0 2.6-.9 2.6-2.3s-1-2.3-2.6-2.3Zm0 9v5.2h3.6c1.9 0 3-.9 3-2.6s-1.1-2.6-3-2.6Z"
      />
    </svg>
  );
}

export default BrandMark;
