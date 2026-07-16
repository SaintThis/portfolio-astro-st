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
  url: 'https://st.saintstraborrr.workers.dev',
  locale: 'en-US',
  location: 'Cagayan de Oro City, Philippines',
  email: 'saintstraborrr@gmail.com',
  phone: '+63 997 355 8878',
  // GitHub profile + this repo — referenced in the footer, contact page & meta.
  github: 'https://github.com/SaintThis',
  repo: 'https://github.com/SaintThis/portfolio-astro-st',
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
  { label: 'GitHub', href: 'https://github.com/SaintThis', icon: 'github', handle: 'SaintThis' },
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
  /** 3D physics lanyard in the homepage Hero's top-right — the heaviest
   *  island in the codebase (three.js + react-three-fiber + a WASM physics
   *  engine). Easy off-switch while its cost/benefit is still being decided. */
  heroLanyard: true,
} as const;

/**
 * Blog reading-experience config. These toggle the surrounding chrome on a post
 * page (table of contents, share rail, left aside, reading progress). Kept here
 * so the blog layout never hardcodes these decisions.
 *
 * `viewCounts`, `reactions`, and `comments` stay OFF until the Postgres backend
 * is wired — they need server state. Flip them on there.
 */
export const BLOG = {
  tableOfContents: true,
  readingProgress: true,
  shareRail: true,
  leftAside: true,
  viewCounts: true, // DB-backed (post_views table)
  reactions: false, // needs backend (future)
  comments: false, // needs backend (future)
  /** Blog index categories. Also used to validate/auto-file posts (the MCP
   *  admin tool picks the closest match when you add content). Keep lowercase
   *  slugs; the label is derived by title-casing unless you add one here. */
  categories: [
    { slug: 'engineering', label: 'Engineering' },
    { slug: 'architecture', label: 'Architecture' },
    { slug: 'frontend', label: 'Frontend' },
    { slug: 'backend', label: 'Backend' },
    { slug: 'rust', label: 'Rust' },
    { slug: 'career', label: 'Career' },
  ],
  /** Posts per page on the blog index (real pagination lands with the SSR/DB phase). */
  pageSize: 8,
} as const;
