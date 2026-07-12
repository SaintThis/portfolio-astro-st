# Architecture

This document explains **how the project is put together and why** — the patterns, the seams, and the trade-offs. Read this before making structural changes.

## Guiding principles

The codebase deliberately applies classic engineering principles so it stays easy to extend:

- **SOLID**
  - **S**ingle Responsibility — each module does one thing (`format.ts` formats, `theme.store.ts` owns theme state, `SEO.astro` owns the `<head>`). Middleware is split into `withLocals` / `withSecurityHeaders` and composed.
  - **O**pen/Closed — add a theme or a project by adding data, not editing logic. The theme list, nav, and socials are all data in `config.ts`.
  - **L**iskov — repositories return the same `Project`/`PostMeta` types whether the source is a local array or a live API, so consumers can't tell the difference.
  - **I**nterface Segregation — `src/lib/api/index.ts` exposes only what pages need; internals (http client, fixtures) stay private.
  - **D**ependency Inversion — pages depend on the **repository abstraction**, never on `fetch` or a data file directly. That inversion is the whole reason swapping to a backend is a one-file change.
- **DRY / Single source of truth** — `config.ts` for brand/nav/themes; `themes.css` for color tokens; `types.ts` for domain shapes.
- **Separation of concerns** — presentation (`components/ui`), interactivity (`components/react`), composition (`components/sections`, `pages`), data (`lib/api` + `data`).
- **Progressive enhancement** — content renders server-side; JS only enriches (filters, cursor, forms). Nothing critical requires JS.

## Rendering model — Astro islands

Astro renders everything to **static HTML by default**. Interactive components are **islands** that hydrate independently:

| Island                 | Directive       | Why that directive                                   |
| ---------------------- | --------------- | ---------------------------------------------------- |
| `Cursor`               | `client:idle`   | Non-critical; hydrate when the main thread is free   |
| `ThemeSwitcher`        | `client:idle`   | Needed soon but not blocking first paint             |
| `MobileNav`            | `client:idle`   | Only interactive on tap                              |
| `ContactForm`          | `client:visible`| Below the fold on `/contact` — hydrate on scroll     |

> **Rule of thumb:** reach for the *laziest* directive that still feels instant. Prefer `client:idle`/`client:visible` over `client:load`. If a thing can be an Astro component with a small inline script (like the loader and scroll-reveal), do that instead of an island — no framework runtime shipped.

### Why the loader & scroll-reveal are **not** React

They hook into the View Transition lifecycle (`astro:before-preparation`, `astro:page-load`) and must persist across navigations. A persistent inline script is far more reliable here than a re-mounting React island, and ships less JS. See `IntroLoader.astro` and `ScrollReveal.astro`.

## The data layer (the API seam)

```
page.astro ──► lib/api (index) ──► repositories ──► [ fixtures | apiGet() ]
                    ▲                     │
                 types.ts ◄───────────────┘  (everything maps INTO domain types)
```

- **`types.ts`** — the domain contract (`Project`, `PostMeta`, `Skill`, …). UI depends on these, nothing else.
- **`http.ts`** — a tiny typed `fetch` wrapper. `API_ENABLED` is true when `PUBLIC_API_BASE_URL` is set.
- **`repositories/*.repo.ts`** — the *only* place that knows the data source. Each function branches: fixtures now, `apiGet(...)` when the API is live.
- **`data/*`** — typed example fixtures / offline fallback.

**To migrate to a backend:** set the env var and adjust endpoint paths in the repositories. Add a `normalize(dto): Project` mapper if the API shape differs. Pages/components stay untouched — that's Dependency Inversion paying off.

## State management

Zustand, three small stores, each single-purpose:

- `theme.store.ts` — persisted (`localStorage`), reflected onto `<html data-theme>`. A no-flash inline script in `BaseLayout` applies the saved theme **before paint**; the store re-syncs on hydration.
- `cursor.store.ts` — ephemeral cursor variant/label (also drivable declaratively via `data-cursor` attributes).
- `ui.store.ts` — ephemeral (mobile nav, boot state).

> Zustand is for **global client state only**. Server data flows through the repository layer, not stores. Don't put fetched lists in Zustand.

## Routing & transitions

File-based routing under `src/pages`. `<ClientRouter />` (in `BaseLayout`) enables View Transitions → SPA-like navigation that also drives the boot loader. Dynamic routes (`[slug].astro`) use `getStaticPaths()` to pre-render one page each.

## Middleware

`src/middleware.ts` composes small functions with `sequence()`:

- `withLocals` — attaches a request id / timing to `Astro.locals` (typed in `env.d.ts`). This is your seam for auth/session later.
- `withSecurityHeaders` — baseline hardening headers.

In `output: 'static'` this runs at build time. It becomes per-request the moment you go SSR.

## Going SSR

When the backend lands and you need per-request rendering:

1. `output: 'server'` (or `'hybrid'`) in `astro.config.mjs`.
2. Add an adapter: `npx astro add node` (or `vercel`/`cloudflare`/`netlify`).
3. Mark dynamic routes with `export const prerender = false`.
4. Middleware now runs on every request — add auth/redirects there.
5. Optionally add API routes under `src/pages/api/*.ts` (the contact form can POST to one).

## Styling architecture

- `themes.css` — each `[data-theme]` re-binds the same **semantic tokens** (`--color-bg`, `--color-accent`, …).
- `global.css` — imports Tailwind, maps those tokens into Tailwind utilities via `@theme inline`, defines base styles + custom utilities (`.text-gradient`, `.bg-grid`, `.scanlines`, `.kicker`).
- **Components never hardcode a hex value** — only semantic utilities (`bg-surface`, `text-accent`). That's what makes theme-switching instant and global.

## Testing (recommended next step)

Not included yet to keep the scaffold lean. Suggested setup:

- **Vitest** for `lib/` units (formatters, repository mapping).
- **Playwright** for E2E (theme switch persists, nav, form submit, reduced-motion).
- **`astro check`** already runs in CI via `npm run build`.

## Directory ownership cheat-sheet

| Want to change…            | Edit…                                              |
| -------------------------- | -------------------------------------------------- |
| Site name / nav / socials  | `src/config.ts`                                    |
| Colors / add a theme       | `src/styles/themes.css` (+ register in `config.ts`)|
| Projects / skills / bio    | `src/data/*` (later: the API)                      |
| A blog post                | `src/content/blog/*.md`                            |
| SEO defaults               | `src/config.ts` → `SITE`, `src/components/seo`     |
| Animations                 | the relevant component's `<script>` / island       |
