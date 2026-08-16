# Theme performance & SEO

Linked from [`CLAUDE.md`](../../CLAUDE.md). Read this before touching caching headers, the font `<link>`, `prefetch` config, or any per-theme `<head>` value. It exists because "a theme is a layout, not a palette" (see [`theme-tokens.md`](theme-tokens.md)) has costs that aren't visible in the diff — the theme lives in a cookie, so it reaches into caching, crawling, and the critical render path.

## The cost model in one paragraph

Every route on this site is `prerender = false`, because middleware has to read the `theme` cookie before a dispatcher can pick a variant. So **every page view is a Worker invocation plus a Postgres round-trip**, and the HTML is `Vary: Cookie`. There is no edge-cached HTML to fall back on. That makes three things expensive that would be free on a static site: repeat visits, prefetching, and anything render-blocking in `<head>`.

## Rule: `private`, never `no-store`

```
Cache-Control: private, no-cache, must-revalidate
```

`private` is the directive that does the isolating — it forbids **any** shared cache from storing the response, which is the entire requirement (one visitor's theme must never be served to another). `no-cache` then forces the browser's own cache to revalidate before reuse, so a DB edit is never served stale.

`no-store` was the original value and is strictly stronger than needed. It cost three things for zero extra safety:

1. **It is the one directive that disables the back/forward cache** in Chrome and Firefox. Every Back press re-ran a full Worker + Postgres render instead of restoring instantly.
2. It made prefetch responses unstorable, so link prefetching threw away everything it fetched.
3. It ruled out conditional revalidation entirely.

**Never reintroduce `no-store` here.** If you think you need it, what you actually need is `private`.

### The bfcache consequence you must keep

Re-enabling bfcache means a restored document can carry a **previous theme's entire markup**. `BaseLayout.astro`'s inline theme script therefore listens for `pageshow` and reloads when `event.persisted` and `<html data-theme>` disagrees with the cookie. It fires only on a genuine mismatch, so ordinary Back navigation keeps its instant restore. If you add another `<head>` value that depends on the theme, it is covered by that same reload — but delete the listener and the whole scheme breaks silently.

## Rule: prefetch on intent, not on viewport

`astro.config.mjs` uses `defaultStrategy: 'hover'`, not `'viewport'`. With `prefetchAll: true` and `viewport`, every link scrolling into view fired a full SSR render — on the blog index that's ~8 posts plus nav and footer, a dozen renders per page view that nobody navigated to, none of it reusable by a shared cache. `hover`/focus fires milliseconds before the click, which is where prefetch actually buys perceived speed. Don't switch this back without making pages cacheable first.

## Rule: `<head>` is per-theme, because the server already knows the theme

Two values in `BaseLayout.astro` are resolved from `Astro.locals.theme`, not hardcoded:

| Value | Resolver | Why |
| --- | --- | --- |
| Google Fonts `href` | `getThemeFontHref(theme)` | Requests **only** the families the theme's `--font-sans/-display/-mono` tokens name. |
| `<meta name="theme-color">` | `getThemeColor(theme)` | Tracks the theme's `--color-bg`; one site-wide value painted dark mobile chrome above Latte's and Paper's cream pages. |

Measured effect on the render-blocking font stylesheet:

| Theme | Families | Font CSS | `@font-face` blocks |
| --- | --- | --- | --- |
| *(old, all themes)* | 4 | 24.7 KB | 64 |
| matrix | 1 | 7.5 KB | 18 |
| cyberpunk / paper | 2 | 19.8 KB | 53 |
| broadcast | 3 | 20.7 KB | 55 |
| latte | 3 | 23.8 KB | 62 |

**When you add a theme, set `fonts` and `themeColor` on its `THEMES` entry.** A family the theme renders but doesn't list degrades silently to the CSS fallback stack — the failure looks like a design bug, not a config one. A family may only come from `FONT_FAMILIES`.

## Rule: every theme's variants must render the same content

The theme comes from a cookie, so **a crawler always sees the default variant** while a returning visitor may see another. If variants rendered different words, that's a content-parity problem the crawler can't see and you can't test by looking at the page.

Two mechanisms enforce this, and both are load-bearing:

- Copy lives in `HERO` / `ABOUT` in [`src/config.ts`](../../src/config.ts), never inside a variant. A variant re-arranges shared text; it never authors its own.
- **Every variant must render exactly one `<h1>`.** `HeroDataGrid` (Matrix) shipped a homepage with *zero* — a readout has no display headline by design — and now carries an `sr-only` `<h1>` with the same words the other four show visibly. `/about`, `/projects`, `/blog` and `/contact` are built entirely from `SectionHeading`s, which default to `h2`; the first heading on each passes `as="h1"`.

Check both after adding a variant:

```js
// in the browser console, per theme
[...document.querySelectorAll('h1')].map((h) => h.textContent.trim());
```

## Rule: don't create a ScrollTrigger from a second `astro:page-load` listener

[`ScrollReveal.astro`](../../src/components/layout/ScrollReveal.astro) calls `ScrollTrigger.getAll().forEach((t) => t.kill())` on **every** `astro:page-load` before rebuilding its own triggers. Any ScrollTrigger another script creates on that same event survives only if its listener happens to be registered *after* ScrollReveal's — an invisible, order-dependent failure.

The About skill meters used to do exactly this. They're now a CSS `width` transition switched on by an `IntersectionObserver` (`AboutSkills.astro` + `SkillsBars.astro`), which has no ordering coupling, needs no reduced-motion branch (the global rule in `global.css` flattens the transition), and replaces 17 triggers with one observer. **Prefer `IntersectionObserver` + CSS for any new scroll-in effect**; reach for `data-reveal` when you want the shared reveal engine, and never hand-roll a third mechanism.

## Verification note

Neither GSAP nor `IntersectionObserver` can be observed in the automated browser pane: it runs with `document.visibilityState === 'hidden'`, `requestAnimationFrame` never fires, and IO callbacks never fire either (confirmed by observing `document.body` and getting zero callbacks). Screenshots fail there for the same reason. Verify scroll-in behaviour in a real window; in the pane, verify the *end state* instead by adding the class manually and reading computed styles. This extends the same caveat in [`loading-states.md`](loading-states.md).
