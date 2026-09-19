const PATHS = {
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </>
  ),
  facebook: <path fill="currentColor" d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />,
  twitter: <path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L1.8 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />,
  youtube: (
    <path
      fill="currentColor"
      d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z"
    />
  ),
};

const LABELS = { instagram: 'Instagram', facebook: 'Facebook', twitter: 'X (Twitter)', youtube: 'YouTube' };
const ALIASES = { x: 'twitter' };

const TONE_CLASSES = {
  dark: 'border-white/10 text-white/70 hover:border-white/30 hover:text-white',
  light: 'border-line bg-white text-ink-600 hover:border-brand-500 hover:bg-brand-500 hover:text-white',
};

/**
 * Brand icons for `settings.social` (`{ instagram, facebook, twitter|x, youtube }` → URLs).
 * `tone`: 'dark' (on ink backgrounds) | 'light'.
 */
export function SocialIcons({ social = {}, className, tone = 'dark' }) {
  const entries = Object.entries(social)
    .map(([key, url]) => [ALIASES[key] ?? key, url])
    .filter(([key, url]) => PATHS[key] && typeof url === 'string' && /^https?:\/\//.test(url));
  if (!entries.length) return null;
  return (
    <ul className={className ?? 'flex gap-2'}>
      {entries.map(([key, url]) => (
        <li key={key}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`BlueMart on ${LABELS[key]}`}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${TONE_CLASSES[tone] ?? TONE_CLASSES.dark}`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              {PATHS[key]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default SocialIcons;
