import { useLocation } from 'react-router';
import { config } from '@/config/env';

/**
 * Document metadata using React 19's native <title>/<meta>/<link> hoisting.
 * `jsonLd` accepts an object (or array) rendered as application/ld+json.
 */
export function Seo({ title, description, image, type = 'website', canonical, noindex = false, jsonLd }) {
  const { pathname } = useLocation();
  const suffix = ` | ${config.siteName}`;
  const fullTitle = !title
    ? `${config.siteName} — Everything You Love. Delivered Better.`
    : title.endsWith(suffix) || title === config.siteName
      ? title
      : `${title}${suffix}`;
  const url = canonical || `${config.siteUrl}${pathname}`;
  const desc =
    description ||
    'Shop curated fashion, footwear, electronics, beauty and home essentials. Secure payments, fast delivery and easy returns.';

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content={config.siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      )}
    </>
  );
}
