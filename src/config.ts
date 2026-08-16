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
 * Web-font families available to themes, as Google Fonts `family=` query
 * fragments. A theme may only reference a key from this map (see
 * `.claude/rules/theme-tokens.md`), and BaseLayout requests **only the
 * families the active theme actually names** — not all four.
 *
 * Before this, every visitor got one stylesheet declaring all four families.
 * That stylesheet is render-blocking, and Google Fonts emits ~10-20
 * `@font-face` blocks per family (one per unicode-range subset), so a Matrix
 * visitor — who renders exactly one family — was parsing four families' worth
 * of subset declarations before first paint. The theme is already resolved
 * server-side, so scoping the request costs nothing.
 */
export const FONT_FAMILIES = {
  inter: 'Inter:wght@400;500;600;700;800',
  jetbrainsMono: 'JetBrains+Mono:wght@400;500;700',
  fraunces: 'Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700',
  archivoBlack: 'Archivo+Black',
} as const;

export type FontFamilyId = keyof typeof FONT_FAMILIES;

/**
 * Theme registry. `data-theme` on <html> is set to one of these ids.
 * Add a new object here + a matching `[data-theme='id']` block in
 * src/styles/themes.css and it just works — no code changes needed.
 *
 * `fonts` must list every family the theme's `--font-sans/-display/-mono`
 * tokens name in themes.css — a family omitted here silently degrades to the
 * CSS fallback stack. `themeColor` is the mobile browser-chrome color and
 * should track the theme's own `--color-bg`; a single site-wide value painted
 * a dark address bar above Latte's and Paper's cream pages.
 */
export const THEMES = [
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    hint: 'Terminal HUD — neon on void, 3D lanyard',
    themeColor: '#08080c',
    fonts: ['inter', 'jetbrainsMono'],
    layout: {
      hero: 'terminal',
      nav: 'bar',
      card: 'standard',
      loader: 'boot',
      lanyard: true,
      about: 'terminal',
      skills: 'bars',
      timeline: 'rail',
    },
  },
  {
    id: 'matrix',
    label: 'Matrix',
    hint: 'Dense mono data-grid, vertical rail nav',
    themeColor: '#020604',
    fonts: ['jetbrainsMono'],
    layout: {
      hero: 'datagrid',
      nav: 'rail',
      card: 'standard',
      loader: 'stream',
      lanyard: false,
      about: 'datagrid',
      skills: 'readout',
      timeline: 'log',
    },
  },
  {
    id: 'latte',
    label: 'Latte',
    hint: 'Editorial magazine — serif masthead, drop-cap',
    themeColor: '#faf6f0',
    fonts: ['inter', 'jetbrainsMono', 'fraunces'],
    layout: {
      hero: 'editorial',
      nav: 'masthead',
      card: 'standard',
      loader: 'latte',
      lanyard: false,
      about: 'editorial',
      skills: 'index',
      timeline: 'dossier',
    },
  },
  {
    id: 'paper',
    label: 'Paper',
    hint: 'Swiss print grid — numbered, hairline rules',
    themeColor: '#f5f4ef',
    fonts: ['inter', 'jetbrainsMono'],
    layout: {
      hero: 'swiss',
      nav: 'bar',
      card: 'standard',
      loader: 'paper',
      lanyard: false,
      about: 'swiss',
      skills: 'index',
      timeline: 'dossier',
    },
  },
  {
    id: 'broadcast',
    label: 'Broadcast',
    hint: 'Bauhaus poster — clipped panels, signal red',
    themeColor: '#111110',
    fonts: ['inter', 'jetbrainsMono', 'archivoBlack'],
    layout: {
      hero: 'broadcast',
      nav: 'block',
      card: 'panel',
      loader: 'signal',
      lanyard: false,
      about: 'broadcast',
      skills: 'bars',
      timeline: 'rail',
    },
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
  return getTheme(id).layout;
}

/** Resolve a full theme entry. Total for the same reason as `getThemeLayout`:
 *  a stale cookie must degrade to the default, never to `undefined`. */
export function getTheme(id: string | undefined) {
  const found = THEMES.find((t) => t.id === id);
  return found ?? THEMES.find((t) => t.id === DEFAULT_THEME)!;
}

/**
 * The Google Fonts stylesheet URL for one theme — only the families that theme
 * actually renders. Emitted from `BaseLayout`, where `Astro.locals.theme` is
 * already known, so nobody downloads Fraunces to read a Matrix page.
 *
 * `display=swap` stays on every variant: text must paint in the fallback face
 * immediately rather than block on the web font.
 */
export function getThemeFontHref(id: string | undefined): string {
  const families = getTheme(id).fonts.map((f) => `family=${FONT_FAMILIES[f]}`);
  return `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
}

/** Mobile browser-chrome color for a theme. See `themeColor` in `THEMES`. */
export function getThemeColor(id: string | undefined): string {
  return getTheme(id).themeColor;
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
 * About-page content, lifted out of `src/pages/about.astro` for exactly the
 * reason `HERO` was lifted out of the hero: five themed variants each holding
 * their own copy would be five forks of the same page, drifting apart the first
 * time a sentence changed.
 *
 * It also protects SEO. The theme comes from a cookie, so a crawler always sees
 * the default variant while a returning visitor may see another — if those
 * rendered *different words*, that's a content-parity problem. One source of
 * copy makes every variant a re-arrangement of the same text, never a rewrite.
 */
export const ABOUT = {
  /** Opening paragraph — the same summary the SEO description uses. */
  lead: AUTHOR.summary,
  /**
   * Second paragraph as segments rather than a raw HTML string, so each variant
   * can style the emphasised spans with its own tokens (Matrix wants them mono
   * and accent-2, Latte wants them italic) without forking the sentence.
   * `em` names the emphasis role; `AboutBody.astro` maps it to real classes.
   */
  body: [
    { t: "I've worked inside enterprise client teams, led a " },
    { t: 'Microfrontend', em: 'strong' },
    { t: ' effort for a core product, and shipped tooling used by 50+ people. I care about ' },
    { t: 'SOLID principles', em: 'accent' },
    { t: ", clean code, and shipping things that don't rot." },
  ] as { t: string; em?: 'strong' | 'accent' }[],
  /** Soft-skill pills. */
  traits: ['Cross-cultural teams', 'Mentoring', 'Ownership', 'B2 English'],
  /** The `profile.json` payload cyberpunk prints in a terminal, Matrix renders
   *  as readout rows, Paper as a numbered index — same facts, three shapes. */
  /** `num` marks a value that is a JSON number, not a string — the terminal
   *  variant prints it unquoted in the warning color the way a syntax
   *  highlighter would. Other variants ignore the flag. */
  profile: [
    { k: 'name', v: SITE.name },
    { k: 'role', v: SITE.role },
    { k: 'location', v: SITE.location },
    { k: 'years', v: '2', num: true },
    { k: 'focus', v: 'web · backend · architecture' },
  ] as { k: string; v: string; num?: boolean }[],
  /** Section headings, shared so every variant labels the page identically. */
  sections: {
    intro: { kicker: 'whoami', title: 'About me', index: '00' },
    skills: { kicker: 'stack', title: 'Skills', index: '01' },
    experience: { kicker: 'history', title: 'Experience', index: '02' },
  },
  cta: { label: "Let's work together", href: '/contact' },
} as const;

/** Skill category → display label. Shared by every `AboutSkills` variant so a
 *  renamed group can't say "Tools & DevOps" in one theme and "DevOps" in another. */
export const SKILL_GROUPS = [
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'devops', label: 'Tools & DevOps' },
] as const;

/**
 * Boot-loader personality per theme. Still ONE component/structure (see
 * `IntroLoader.astro` — resist forking this into five components), but each
 * profile now also names a `motif`: a small theme-specific visual (HUD corner
 * reticle, matrix rain, a self-drawing rule, a ticking Swiss numeral, broadcast
 * color bars) that the component renders conditionally and the shared CSS/JS
 * drives, instead of five themes reusing one identical box with only the log
 * text swapped out.
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
    motif: 'hud',
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
    motif: 'rain',
  },
  /** Editorial magazine — no fake boot sequence, a masthead-style reveal instead. */
  latte: {
    lines: [] as string[],
    showBar: false,
    showBrand: true,
    motif: 'masthead',
    kicker: 'Now reading',
  },
  /** Swiss print grid — no boot sequence either; a ticking numeral IS the
   *  progress indicator, styled like a poster page number, not a percentage. */
  paper: {
    lines: [] as string[],
    showBar: false,
    showBrand: true,
    motif: 'index',
  },
  signal: {
    lines: ['◼ CH.01 — SIGNAL ACQUIRED', '◼ ON AIR'],
    showBar: true,
    showBrand: true,
    motif: 'broadcast',
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
