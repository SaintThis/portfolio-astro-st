# portfolio-astro-st

> Cyberpunk / coder-themed personal portfolio — **fast, SEO-friendly, and API-ready**.
> Built with Astro's islands architecture, React islands for interactivity, GSAP + Motion for animation, and Zustand for global UI state.

Personal site for **Saint Rabor** — Fullstack Developer (React/Next · TypeScript · Rust · Django · Node).

---

## ✨ Highlights

- **Astro islands** — ships near-zero JS; interactivity is opt-in per component.
- **Multi-theme engine** — 4 themes (`cyberpunk`, `matrix`, `synthwave`, `paper`) via CSS variables + a no-flash loader. Add a theme in two files.
- **Dynamic custom cursor** — lerp-follow ring + dot, magnetic hover, respects `prefers-reduced-motion` and coarse pointers.
- **Intro boot loader** — a terminal-style boot sequence on first load **and** every route change (hooked into Astro View Transitions).
- **API-ready data layer** — a repository pattern means swapping example data for a live backend is a *one-file* change. Components never change.
- **SEO out of the box** — canonical URLs, Open Graph/Twitter, JSON-LD, sitemap, RSS, `robots.txt`.
- **Type-safe content** — blog posts are Content Collections with a validated schema.
- **Middleware-ready** — security headers today; a drop-in seam for auth/i18n when you go SSR.

## 🧱 Tech Stack

| Concern         | Choice                              | Why                                                                 |
| --------------- | ----------------------------------- | ------------------------------------------------------------------- |
| Framework       | **Astro 7**                         | HTML-first, islands, Rust compiler (fast builds), SSR when needed   |
| UI islands      | **React 19**                        | Interactivity only where it's needed (cursor, theme, forms, nav)    |
| Styling         | **Tailwind CSS v4**                 | Utility-first, CSS-native config, theme tokens via CSS variables    |
| Timeline anim   | **GSAP + ScrollTrigger**            | Robust scroll reveals, boot loader, skill bars                      |
| Component anim  | **Motion** (Framer Motion)          | Spring/gesture animation inside React islands                       |
| Global state    | **Zustand**                         | Tiny, unopinionated store for theme/cursor/UI (client-only)         |
| Content         | **Astro Content Collections**       | Type-safe local markdown, ready for a remote loader later           |

> **Why these?** See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the reasoning and the trade-offs, and [`DESIGN.md`](./DESIGN.md) for the visual language.

## 🚀 Getting Started

```bash
# Node 20.11+ required
npm install
cp .env.example .env      # optional — only needed for a real API/contact endpoint
npm run dev               # http://localhost:4321
```

### Scripts

| Command             | Description                                        |
| ------------------- | -------------------------------------------------- |
| `npm run dev`       | Start the dev server                               |
| `npm run build`     | Type-check (`astro check`) + production build      |
| `npm run preview`   | Preview the production build locally               |
| `npm run check`     | Astro/TS diagnostics only                          |
| `npm run format`    | Prettier (incl. Astro + Tailwind class sorting)    |
| `npm run typecheck` | `tsc --noEmit`                                     |

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/     # Header, Footer, IntroLoader, ScrollReveal engine
│   ├── react/      # Interactive islands (Cursor, ThemeSwitcher, MobileNav, ContactForm)
│   ├── sections/   # Page sections (Hero, BentoAbout, FeaturedWork, ContactCTA)
│   ├── seo/        # <SEO /> head component
│   └── ui/         # Presentational primitives (Button, Tag, Card, TerminalWindow…)
├── content/        # Blog posts (markdown) — validated by content.config.ts
├── data/           # EXAMPLE data (projects, skills, experience) — swap for API
├── layouts/        # BaseLayout (app shell)
├── lib/
│   ├── api/        # Data layer: types, http client, repositories (the API seam)
│   ├── stores/     # Zustand stores (theme, cursor, ui)
│   └── utils/      # cn(), formatting helpers
├── pages/          # File-based routes (+ rss.xml, robots.txt)
├── styles/         # global.css + themes.css
├── config.ts       # Single source of truth: site meta, nav, socials, themes
└── middleware.ts   # Security headers + per-request seam
```

## 🗺️ Routes

| Route              | Purpose                                                      |
| ------------------ | ----------------------------------------------------------- |
| `/`                | Home — hero, bento about, featured work, CTA                |
| `/about`           | Bio, animated skills, experience timeline                   |
| `/projects`        | Filterable project grid                                     |
| `/projects/[slug]` | Project case study (static per project)                     |
| `/blog`            | Post index                                                  |
| `/blog/[slug]`     | Post (Content Collections + custom prose styles)            |
| `/contact`         | API-ready contact form + direct links                       |
| `/404`             | Themed not-found                                            |
| `/rss.xml`         | RSS feed · `/robots.txt` · `/sitemap-index.xml`             |

**Ideas to add later:** `/uses` (gear/setup), `/now` ([nownownow](https://nownownow.com)), `/snippets` or `/til` (today-I-learned), `/resume` (downloadable). All follow the same page pattern.

## 🔌 Wiring up a real backend

The app reads all dynamic data through **repositories** in `src/lib/api/repositories`. Today they return local fixtures from `src/data`. To go live:

1. Set `PUBLIC_API_BASE_URL` in `.env`.
2. In each repository, the `API_ENABLED` branch already calls `apiGet(...)` — adjust the endpoint paths / add a `normalize()` mapper to your API shape.
3. That's it — pages and components are untouched.

For SSR/dynamic pages, flip `output: 'server'` in `astro.config.mjs`, add an adapter (`@astrojs/node`, `@astrojs/vercel`, …), and set `export const prerender = false` on the routes that need per-request data. See [`ARCHITECTURE.md`](./ARCHITECTURE.md#going-ssr).

## ♿ Accessibility & Performance

- All motion respects `prefers-reduced-motion`.
- Custom cursor disabled on touch (OS cursor restored); under reduced-motion it stays but the trailing animation is removed (ring snaps to the pointer).
- Semantic landmarks, focus-visible rings, `aria-current` on nav.
- Fonts use `display=swap`; consider self-hosting via `@fontsource` (see [`DESIGN.md`](./DESIGN.md#fonts)).

## 📦 Deploy (free hosting)

Static output builds to `dist/` — host it anywhere. First set `site` in `astro.config.mjs` to your final URL (drives canonical URLs, sitemap, RSS).

**Easiest — root-domain hosts (recommended, zero config, works with this theme's root-absolute links):**

| Host | How | URL you get |
| ---- | --- | ----------- |
| **Vercel** | Import the GitHub repo → framework auto-detected as Astro → Deploy | `your-project.vercel.app` |
| **Netlify** | "Add new site" → pick repo (build `npm run build`, publish `dist`) | `your-project.netlify.app` |
| **Cloudflare Pages** | Connect repo → framework preset **Astro** | `your-project.pages.dev` |

All three auto-redeploy on every push to `main` and support free custom domains.

**GitHub Pages** (you're already here) — a workflow is included at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Enable it under **Settings → Pages → Source: GitHub Actions**. ⚠️ A *project* Pages site serves under `…github.io/portfolio-astro-st/`, which needs `base: '/portfolio-astro-st'` **and** base-aware internal links. To avoid that, use a **custom domain**, rename the repo to `<user>.github.io` (served at root), or pick one of the hosts above.

## 📄 License

MIT © Saint Rabor
