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
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    hint: 'Terminal HUD — neon on void, 3D lanyard',
    layout: { hero: 'terminal', nav: 'bar', card: 'standard', loader: 'boot', lanyard: true },
  },
  {
    id: 'matrix',
    label: 'Matrix',
    hint: 'Dense mono data-grid, vertical rail nav',
    layout: { hero: 'datagrid', nav: 'rail', card: 'standard', loader: 'stream', lanyard: false },
  },
  {
    id: 'latte',
    label: 'Latte',
    hint: 'Editorial magazine — serif masthead, drop-cap',
    layout: {
      hero: 'editorial',
      nav: 'masthead',
      card: 'standard',
      loader: 'fade',
      lanyard: false,
    },
  },
  {
    id: 'paper',
    label: 'Paper',
    hint: 'Swiss print grid — numbered, hairline rules',
    layout: { hero: 'swiss', nav: 'bar', card: 'standard', loader: 'fade', lanyard: false },
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
    hint: 'Bauhaus poster — clipped panels, signal red',
    layout: { hero: 'broadcast', nav: 'block', card: 'panel', loader: 'signal', lanyard: false },
  },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];
export const DEFAULT_THEME: ThemeId = 'cyberpunk';

/** The layout profile for a theme — which structural variant each surface uses. */
export type ThemeLayout = (typeof THEMES)[number]['layout'];

/**
 * Resolve a theme's layout profile.
 *
 * Deliberately total: an unknown id (a stale cookie, a removed theme) falls
 * back to the default rather than returning undefined, because callers use the
 * result to pick a component — `undefined` there would render nothing at all.
 */
export function getThemeLayout(id: string | undefined): ThemeLayout {
  const found = THEMES.find((t) => t.id === id);
  return (found ?? THEMES.find((t) => t.id === DEFAULT_THEME)!).layout;
}

/**
 * Breakpoint at which the desktop nav replaces the mobile drawer. Exported so
 * `Header` variants and `Sidebar.tsx` can never disagree — they used to hold
 * `lg:flex` and `lg:hidden` independently, and v2's header used `sm:` instead,
 * which would have shown both at once.
 */
export const NAV_BREAKPOINT = 'lg' as const;

/**
 * Hero content, lifted out of the component so every theme's hero variant
 * renders the SAME words in a different structure. Five variants each holding
 * their own copy would be five forks of the homepage, drifting apart the first
 * time a headline changed.
 */
/** One call-to-action in the hero. `icon`/`download` are optional on every
 *  action so a variant can map the list without narrowing per-member. */
export interface HeroAction {
  label: string;
  href: string;
  variant: 'primary' | 'outline' | 'ghost';
  icon?: string;
  download?: string;
}

export const HERO = {
  /** Rendered as three parts so a variant can stack, inline, or split them. */
  headline: { lead: 'Building', trail: 'that ship & scale.' },
  /** Cycled by the scramble effect in the hero's shared script. */
  rotatorWords: ['fullstack systems', 'microfrontends', 'Rust services', 'clean interfaces'],
  intro:
    'turning messy requirements into fast, maintainable products. Frontend craft, backend depth, clean architecture.',
  stack: ['React', 'Next.js', 'TypeScript', 'Django', 'Node.js', 'Flutter'],
  actions: [
    { label: 'View Work', href: '/projects', variant: 'primary', icon: '→' },
    { label: 'Get in touch', href: '/contact', variant: 'outline' },
    {
      label: 'Resume',
      href: '/resume.pdf',
      variant: 'ghost',
      icon: '↓',
      download: 'Saint-Rabor-Resume.pdf',
    },
  ] as HeroAction[],
  /** Broadcast's poster hero uses these; kept here for the same reason. */
  broadcast: {
    eyebrow: 'New Eridu Broadcasting',
    quote: 'Ship the thing. Then make it fast.',
    statLabel: 'EXPERIENCE',
    statValue: '2+ / YRS',
  },
} as const;

/** Longest rotator word — reserved as a `ch` min-width so the scramble can't
 *  resize its own box mid-animation and nudge the paragraph below it. */
export const ROTATOR_MAX_CH = Math.max(...HERO.rotatorWords.map((w) => w.length));

/**
 * Boot-loader personality per theme. Data, not five cloned overlay components —
 * the overlay is one structure whose *content* and pacing change.
 */
export const LOADERS = {
  boot: {
    lines: [
      '▓ initializing kernel...',
      '▓ mounting /@saintrabor',
      '▓ syncing content collections...',
      '▓ decrypting theme buffers...',
      '▓ waking cursor daemon...',
      '▓ establishing secure uplink ✓',
    ],
    showBar: true,
    showBrand: true,
  },
  stream: {
    lines: [
      '$ ./connect --host saintrabor',
      '$ handshake ok',
      '$ streaming payload',
      '$ 0x1F3A verified',
      '$ ready',
    ],
    showBar: true,
    showBrand: true,
  },
  /** Editorial/print themes don't perform a boot sequence — just a name. */
  fade: { lines: [] as string[], showBar: false, showBrand: true },
  signal: {
    lines: ['◼ CH.01 — SIGNAL ACQUIRED', '◼ ON AIR'],
    showBar: true,
    showBrand: true,
  },
} as const;

export type LoaderId = keyof typeof LOADERS;

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

/**
 * Projects index behaviour. Mirrors BLOG so both listings filter/paginate the
 * same way — server-side via ?category= and ?page=, no client JS (an earlier
 * client-side filter silently broke when its data attribute was dropped).
 */
export const PROJECTS = {
  /** Cards per page on /projects — 6 fills two rows of the 3-column grid. */
  pageSize: 6,
  /** DB-backed view counts on project pages (project_views table). */
  viewCounts: true,
} as const;
