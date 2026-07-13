# Verification protocol

Linked from [`CLAUDE.md`](../../CLAUDE.md). Follow this before calling any change done — it exists so "done" means observed working, not just "the diff looks right."

## 1. Types first, always

```bash
npm run check   # astro check — faster than a full build, catches most mistakes
```

Run after every edit, not just at the end. `npm run build` runs this internally (`astro check && astro build`), so a passing `check` mid-task saves a full rebuild later.

## 2. Full build before calling anything done

```bash
npm run build
```

Must show **0 errors** (`CLAUDE.md`'s Definition of Done requires this). Skim the generated route list in the output — a missing page or an unexpected error mid-list means something silently failed to prerender.

## 3. If the change is observable in a browser, prove it — don't just assert it

Skip this step only for changes with no runtime surface (types-only refactors, docs, config that isn't rendered). Anything touching a component, page, style, or animation gets driven in an actual browser:

1. **Start a preview**, don't guess. This repo's `.claude/launch.json` has two configs:
   - `astro-dev` (port 4321) — hot-reloading dev server. Use it if nothing else is already running on that port.
   - `astro-preview` (port 4322) — serves the production `dist/` build via `npm run preview`. Use this one when another session already has `astro-dev` running (Astro allows only one dev-server instance per project — it'll refuse a second with a clear "Another astro dev server is already running" error), or when you specifically want to verify the built output rather than the dev server.
   - Run `npm run build` first if using `astro-preview` — it serves whatever is currently in `dist/`, not live-reloaded source.
2. **Wait past the intro loader.** This site has a boot-sequence animation on load (`IntroLoader.astro`) — a screenshot taken immediately after navigation often just shows the loader, not the page. Wait ~2-3s, or check for the loader's exit before asserting on content.
3. **Check for errors** — `read_console_messages`, `preview_logs`, `read_network_requests` — before trusting anything visual.
4. **Read structure, don't just eyeball pixels.** `read_page` (or `get_page_text`) for text/structure; reserve screenshots for genuinely visual changes (color, layout, animation).
5. **For interaction changes** (hover states, click handlers, form submission): don't rely on the automation tool's synthetic `hover`/`click` alone if the effect depends on real pointer events — dispatching a real `PointerEvent('pointerover', { bubbles: true })` via `javascript_tool` and reading `getComputedStyle` afterward is more reliable for confirming exact computed values (this is how the cursor shape-morphing work in this repo was verified: measuring the hovered element's real `getBoundingClientRect()` against the cursor ring's resulting computed `width`/`height`/`borderRadius`/`boxShadow`).
6. **Multiple themes / reduced motion, when relevant.** If a change touches color or animation, spot-check at least one non-default theme (`data-theme="paper"` has zero `--glow` — a good stress test for anything glow-based) and confirm `prefers-reduced-motion: reduce` still no-ops it (see `CLAUDE.md` golden rule #5 — this repo's global CSS already forces `transition-duration: 0.001ms !important` under that media query, so most new CSS transitions are covered for free; verify JS-driven animation (GSAP, Motion springs) separately, since that global rule can't reach inline JS timing).

## 4. Don't claim what you didn't check

If a change can't be verified in the browser preview (a different runtime, a build-time-only script, something requiring a real backend that isn't wired up), say so explicitly rather than reporting success based on type-checks alone. Type-checking and a clean build verify correctness of the code; they don't verify the feature does what was asked.
