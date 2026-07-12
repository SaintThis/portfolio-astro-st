/**
 * Site-wide configuration — the single source of truth.
 *
 * Keep content-ish constants here so pages/components never hardcode strings.
 * When you wire up a real CMS/API, most of this can stay static (it's brand
 * metadata), while dynamic content moves to `src/lib/api`.
 */

export const SITE = {
  name: 'Saint Rabor',
  handle: '@saintrabor',
  role: 'Fullstack Developer',
  title: 'Saint Rabor — Fullstack Developer',
  description:
    'Fullstack developer with 2+ years shipping production web apps. React/Next.js & TypeScript on the front, Rust, Django & Node.js on the back. Microfrontend architecture, clean code, and performance.',
  url: 'https://saintrabor.dev',
  locale: 'en-US',
  location: 'Cagayan de Oro City, Philippines',
  email: 'saintstraborrr@gmail.com',
  phone: '+63 997 355 8878',
  // Path to the default social-share image in /public.
  ogImage: '/og/default.png',
  themeColor: '#0a0a0f',
} as const;

export const AUTHOR = {
  name: 'Saint Rabor',
  summary:
    'Fullstack Developer with 2+ years of experience building and maintaining production web applications across the full stack. Skilled in React/Next.js and TypeScript on the frontend, and Rust, Django, and Node.js on the backend.',
  availableForWork: true,
} as const;

/** Primary navigation — used by the header + mobile menu. */
export const NAV_LINKS = [
  { label: 'Home', href: '/', prefetch: true },
  { label: 'About', href: '/about', prefetch: true },
  { label: 'Projects', href: '/projects', prefetch: true },
  { label: 'Blog', href: '/blog', prefetch: true },
  { label: 'Contact', href: '/contact', prefetch: true },
] as const;

/** Social / external links — rendered in footer + contact page. */
export const SOCIALS = [
  { label: 'GitHub', href: 'https://github.com/', icon: 'github', handle: 'saint-rabor' },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/saint-rabor18',
    icon: 'linkedin',
    handle: 'saint-rabor18',
  },
  { label: 'Email', href: 'mailto:saintstraborrr@gmail.com', icon: 'mail', handle: SITE.email },
] as const;

/**
 * Theme registry. `data-theme` on <html> is set to one of these ids.
 * Add a new object here + a matching `[data-theme='id']` block in
 * src/styles/themes.css and it just works — no code changes needed.
 */
export const THEMES = [
  { id: 'cyberpunk', label: 'Cyberpunk', hint: 'Neon magenta + cyan on void black' },
  { id: 'matrix', label: 'Matrix', hint: 'Terminal green on black' },
  { id: 'synthwave', label: 'Synthwave', hint: 'Sunset purple + orange' },
  { id: 'paper', label: 'Paper', hint: 'Light, high-contrast day mode' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export const DEFAULT_THEME: ThemeId = 'cyberpunk';

/** Feature flags — flip animations/effects off globally for debugging or a11y. */
export const FEATURES = {
  customCursor: true,
  introLoader: true,
  pageTransitions: true,
} as const;
