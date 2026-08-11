# Theme tokens

Linked from [`CLAUDE.md`](../../CLAUDE.md). Read this before styling anything — it exists so an agent never hardcodes a hex value or invents a token name that isn't real (golden rule #1 in `CLAUDE.md`).

**Source of truth**: [`src/styles/themes.css`](../../src/styles/themes.css) defines the raw CSS variables per theme; [`src/styles/global.css`](../../src/styles/global.css)'s `@theme inline` block maps them to the Tailwind utility names below. If a value here ever looks stale, those two files win — re-read them, don't trust this cache.

## A theme is a LAYOUT, not a palette

Two things changed in the layout overhaul, and both matter before you touch anything:

1. **The theme is resolved server-side.** A `theme` cookie is read by `withLocals` in [`src/middleware.ts`](../../src/middleware.ts) into `Astro.locals.theme`, and `THEMES` in [`src/config.ts`](../../src/config.ts) carries a `layout` profile per theme (`{ hero, nav, card, loader, lanyard }`). Components call `getThemeLayout(Astro.locals.theme)` and render a *different component*, not just different colors. Changing theme triggers a full `location.reload()` — there is no way to swap layouts in place.
2. **The cookie is the single source of truth.** The zustand store is deliberately **not** persisted; a second copy in `localStorage` could disagree with the cookie, which would mean one theme's markup wearing another's tokens. If you add a theme, its id must be in `THEMES` or middleware rejects the cookie and falls back to `DEFAULT_THEME`.

**Don't read the cookie in an island's initial state.** React islands are server-rendered too, so a client-side cookie read at init makes the first client render disagree with the server's and trips React hydration error #418. The store initialises to `DEFAULT_THEME` and `ThemeSwitcher` adopts the real value from `<html data-theme>` in a mount effect — after hydration is safe. This was a real regression during the overhaul.

Everything below still applies — a `[data-theme]` block re-binds **eight groups** of tokens, and that's what carries the look *within* a chosen layout:

| Group | Tokens |
| --- | --- |
| Surfaces & text | `--color-bg`, `--color-bg-soft`, `--color-surface`, `--color-surface-2`, `--color-border`, `--color-fg{,-muted,-faint}` |
| Accents & status | `--color-accent{,-2,-3}`, `--color-accent-contrast`, `--color-success`, `--color-warning`, `--color-danger` |
| Typography | `--font-sans`, `--font-display`, `--font-mono`, `--heading-weight`, `--heading-tracking` |
| Shape | `--radius-box`, `--border-w` |
| Depth & light | `--glow`, `--shadow-card`, `--nav-blur` |
| Backdrop | `--backdrop-image`, `--backdrop-size`, `--backdrop-mask`, `--bg-gradient`, `--grid-line`, `--scanline-opacity` |
| Motion | `--ease-out-expo`, `--dur` |
| Cursor | `--cursor-size`, `--cursor-radius`, `--cursor-blend` |
| Layout metrics | `--header-h`, `--section-y`, `--corner-cut`, `--label-transform`, `--label-tracking` |

**Adding a theme = copy a block in `themes.css`, set all groups, register it in `src/config.ts` → `THEMES` with a `layout` profile.** If the profile names a variant that doesn't exist yet, build it. If you add a *new* token, add it to **every** theme block or callers get the `var()` fallback silently.

`--header-h` is the highest-value one: the hero's viewport math (`calc(100dvh - var(--header-h))`) and the fixed-nav spacer both read it, so a taller nav variant can't desync them. It used to be a hardcoded `4rem` in three places.

## The five themes and their layouts

| id | Look | Hero | Nav | Card | Loader | Lanyard |
| --- | --- | --- | --- | --- | --- | --- |
| `cyberpunk` (default) | Terminal HUD, neon on void | `terminal` | fixed blurred bar | standard + bracket | `boot` | **yes** |
| `matrix` | Dense mono readout | `datagrid` | **left vertical rail** | standard + bracket | `stream` | no |
| `latte` | Editorial magazine | `editorial` (drop-cap) | **centred serif masthead** | standard, no bracket | `fade` | no |
| `paper` | Swiss print grid | `swiss` (12-col) | minimal bar | standard, no bracket | `fade` | no |
| `broadcast` | Bauhaus poster (was `/v2`) | `broadcast` (ProfileCard) | flat opaque block | **clipped panel** | `signal` | no |

Variant components live in `src/components/themed/{hero,nav,card}/`. **The Lanyard is imported by `HeroTerminal.astro` and nowhere else** — `Lanyard.tsx` calls `useGLTF.preload()` at module scope, so a runtime `null` return would still download the 2.4 MB GLB. Gating = not importing.

Fonts are loaded once in `BaseLayout.astro` (Inter, JetBrains Mono, Fraunces, Archivo Black — all `display=swap`). **A theme may only use a face from that list.**

## Why the variant set is small

Astro collects scoped CSS and hoists `<script>` tags from the **static module graph**, not from what actually renders — so every variant a dispatcher imports ships its CSS to every visitor regardless of their theme. `await import()` doesn't help: the styles fall out of the graph and the `<link>` is never emitted.

Hence the rule: **structural difference → variant component; everything else → `[data-theme='x']` CSS.** Five heroes earn it (genuinely different documents). Navs collapse to three (one bar serves cyberpunk/paper/broadcast via a `mode` prop). Cards collapse to two. The loader is one component driven by the `LOADERS` data table in `config.ts`. Resist adding more.

## Color tokens

Each row is one semantic token. Use the Tailwind utility column in markup (`bg-surface`, `text-accent`); use the CSS var column only inside a `<style>` block or inline `style` that needs the raw value (e.g. `color-mix(in srgb, var(--color-accent-2) 45%, transparent)`).

| Tailwind utility | CSS var | Cyberpunk | Aurora | Nord | Mono | Latte |
| --- | --- | --- | --- | --- | --- | --- |
| `bg-bg` | `--color-bg` | `#08080c` | `#0a0f1a` | `#2e3440` | `#000000` | `#faf6f0` |
| `bg-surface` | `--color-surface` | `#12121c` | `#131c2e` | `#3b4252` | `#101010` | `#ffffff` |
| `bg-surface-2` | `--color-surface-2` | `#191926` | `#1a2540` | `#434c5e` | `#181818` | `#f6f1e9` |
| `border-border` | `--color-border` | `#262636` | `#24304d` | `#4c566a` | `#2e2e2e` | `#e2d8c9` |
| `text-fg` | `--color-fg` | `#e8e8f0` | `#eaf0ff` | `#eceff4` | `#fafafa` | `#2a2320` |
| `text-fg-muted` | `--color-fg-muted` | `#9a9ab0` | `#9aa8c7` | `#b9c1d0` | `#a1a1a1` | `#6b5f56` |
| `text-fg-faint` | `--color-fg-faint` | `#5a5a70` | `#5c6b8a` | `#7b869c` | `#6b6b6b` | `#9c9086` |
| `text-accent` | `--color-accent` | `#ff2e88` | `#6d8cff` | `#88c0d0` | `#ffffff` | `#b4531f` |
| `text-accent-2` | `--color-accent-2` | `#00f0ff` | `#45e0c8` | `#81a1c1` | `#d4d4d4` | `#1f6f5c` |
| `text-accent-3` | `--color-accent-3` | `#b026ff` | `#a97bff` | `#b48ead` | `#8a8a8a` | `#7c4dbe` |
| `text-accent-contrast` | `--color-accent-contrast` | `#08080c` | `#0a0f1a` | `#2e3440` | `#000000` | `#ffffff` |

(`matrix`, `synthwave`, `paper` keep their original values — see `themes.css`.)

**Never write a hex value in a component.** If you need a color, one of the rows above already covers it. If it genuinely doesn't, add a new token to **all eight** blocks in `themes.css` + the `@theme inline` map in `global.css` — don't inline a one-off hex "just this once."

## Non-color tokens

| Token | Notes |
| --- | --- |
| `--radius-box` | The only border-radius in the design language, but now **theme-owned**: 0px (mono) → 14px (aurora). Never hardcode `rounded-lg`; use `rounded-[var(--radius-box)]`. |
| `--font-display` | Headings only (`h1`–`h4` in `@layer base`). A component that sets its own `font-*` utility overrides this — that's why the Hero's `font-extrabold` beats `--heading-weight`. |
| `--glow` | `0 0 0` in every light/flat theme (paper, latte, mono), so anything built on it degrades gracefully instead of needing a light-mode branch. |
| `--backdrop-image` / `-size` / `-mask` | Consumed by `.bg-grid`. The *pattern itself* is the token: grid lines, dot grid, radial blobs, or `none`. |
| `--bg-gradient` | Full-page wash on `body`, `background-attachment: fixed`. `none` in flat themes. |
| `--scanline-opacity` | `.scanlines::before` opacity. `0` opts a theme out entirely — don't add a second class for that. |
| `--nav-blur` | Consumed by `.nav-blur` (Header). `0px` in mono = hard opaque bar. |
| `--shadow-card` | Consumed by `.shadow-card`. `none` in flat themes, real elevation in glassy/light ones. |
| `--cursor-size` / `-radius` / `-blend` | Resting size/shape of the custom cursor ring. Hover still overrides in JS to match the hovered element. `mix-blend-mode: difference` is what makes Mono's cursor invert content. |
| `--ease-out-expo`, `--dur` | Animation feel. Aurora overshoots slightly; mono is snappy with no overshoot. |

## Ready-made utility classes (don't reinvent these)

| Class | What it does |
| --- | --- |
| `.text-glow` / `.box-glow` | text/box-shadow using `--glow` + current accent. |
| `.text-gradient` | Accent-to-accent-3 gradient text clip. |
| `.bg-grid` | Full-bleed themed backdrop (pattern comes from `--backdrop-image`). |
| `.scanlines::before` | Scanline overlay, opacity from `--scanline-opacity`. Apply to a `position: relative` container. |
| `.nav-blur` | Themed `backdrop-filter` for chrome surfaces. |
| `.shadow-card` | Themed elevation. |
| `.kicker` | Mono, uppercase, letter-spaced label above section headings. |

If a new component needs a glow/gradient/grid/blur effect, reach for one of these first — check `global.css` before writing a new one.
