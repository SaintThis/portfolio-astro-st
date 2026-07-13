# Component inventory

Linked from [`CLAUDE.md`](../../CLAUDE.md). Check this before building something new — it exists so an agent reuses what's already here instead of re-implementing it, and never passes a prop that doesn't actually exist.

Every `Props` interface below is copied from the component's actual source — if it's not listed here, the component takes no props (reads from `@/config` / `@lib/api` / `@lib/stores` directly instead).

## `src/components/ui/*.astro` — reusable presentational

| Component | Props | Notes |
| --- | --- | --- |
| `Button.astro` | `href?, variant?: 'primary'\|'ghost'\|'outline' (default 'primary'), size?: 'sm'\|'md'\|'lg' (default 'md'), class?, type?: 'button'\|'submit', [any other attr]` | Polymorphic: renders `<a>` if `href` is set, else `<button>`. Extra props (`download`, `target`, `aria-*`, …) pass straight through via `{...rest}`. Always carries `data-cursor="hover"`. |
| `Tag.astro` | `class?, accent?: boolean (default false)` | Small mono pill. `accent` swaps to the accent-tinted variant. |
| `Reveal.astro` | `y?: number (default 24), delay?: number (default 0), class?` | GSAP ScrollTrigger scroll-reveal wrapper. Respects reduced-motion; never leaves content hidden if JS is unavailable (`html.no-js` fallback). |
| `SectionHeading.astro` | `kicker?, title: string, index?, align?: 'left'\|'center' (default 'left')` | Has a `title` named slot (overrides the `title` prop) and a default slot for extra header content. |
| `TerminalWindow.astro` | `title?: string (default 'zsh — saint@dev'), class?` | Faux terminal chrome; content goes in the default slot. |
| `ProjectCard.astro` | `project: Project` (from `@lib/api/types`) | Full-bleed card, `data-cursor="hover"` + `data-cursor-label="View"`. Renders `project.metrics` only if present. |

## `src/components/react/*.tsx` — client islands

| Component | Props | Hydration directive used | Notes |
| --- | --- | --- | --- |
| `Cursor.tsx` | none | `client:load` (the one deliberate exception — see its own file comment) | Custom cursor: dot + shape-morphing ring. See `.claude/rules/theme-tokens.md` for the glow tokens it uses. |
| `ThemeSwitcher.tsx` | none | `client:idle` | Base UI `Select`. Reads/writes `useThemeStore`. Portals into `#base-ui-portal-root` (see Header/BaseLayout comments — do not change this without reading why). |
| `Sidebar.tsx` | none | `client:idle` | Base UI `Dialog`, mobile/tablet nav drawer (`lg:hidden`). Also portals into `#base-ui-portal-root`. |
| `ContactForm.tsx` | none | `client:visible` (used in `src/pages/contact.astro`) | Posts to `PUBLIC_API_BASE_URL/contact` if configured, else simulates success. Has a honeypot field (`_gotcha`). |

## `src/components/sections/*.astro` — page sections

None of these take props — each pulls its own data from `@/config` and `@lib/api` directly (that's why they're "sections," not reusable components).

| Component | Data source | Uses |
| --- | --- | --- |
| `Hero.astro` | `SITE`, `AUTHOR` from `@/config` | `Button`, `Tag` |
| `FeaturedWork.astro` | `getFeaturedProjects()` from `@lib/api` | `SectionHeading`, `ProjectCard`, `Reveal`, `Button` |
| `BentoAbout.astro` | `SITE` from `@/config` | `Reveal`, `Tag` |
| `ContactCTA.astro` | `SITE` from `@/config` | `Button`, `Reveal` |

## `src/components/layout/*.astro` — app chrome

None take props either.

| Component | Role |
| --- | --- |
| `Header.astro` | Fixed nav, `transition:persist`'d across View Transitions. Owns `#base-ui-portal-root` sibling div (see `BaseLayout.astro` comment for why it must be a *sibling*, not nested inside). |
| `Footer.astro` | Site-wide footer — nav links, socials, source link. Not the same as the per-post "Read next" footer in `src/pages/blog/[...slug].astro`, which is page-specific. |
| `IntroLoader.astro` | Boot-sequence intro (Astro + inline script, deliberately not a React island — see `CLAUDE.md` gotchas). |
| `ScrollReveal.astro` | Shared GSAP ScrollTrigger setup consumed by every `Reveal.astro` instance. |

## Before adding a new component

1. Check this file for something close enough to extend (a new `Button` variant beats a new component).
2. If it's genuinely new: static → `components/ui/*.astro` (reusable) or `components/sections/*.astro` (page-specific, no reuse expected); only reach for `components/react/*.tsx` if it needs real client interactivity (see `CLAUDE.md` golden rule #4).
3. Add a row to the relevant table above once it exists — this file rots the moment it's out of sync, so keep it in the same commit as the component.
