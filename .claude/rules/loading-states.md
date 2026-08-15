# Loading states

Linked from [`CLAUDE.md`](../../CLAUDE.md). Read this before adding, moving, or "improving" any loading UI — the three states below have deliberately different jobs, and collapsing them back into one is the regression this file exists to prevent.

## The three tiers

| Tier | Component | Fires when | Looks like |
| --- | --- | --- | --- |
| Global | [`layout/IntroLoader.astro`](../../src/components/layout/IntroLoader.astro) | **Cold document only** — first visit, hard refresh, direct URL hit | Full-viewport overlay; content is **per theme** (see below) |
| Navigation | [`layout/NavProgress.astro`](../../src/components/layout/NavProgress.astro) | Client-side navigation (View Transitions) that takes **> 180 ms** | 2px accent bar pinned to the top edge |
| Async region | [`ui/Skeleton.astro`](../../src/components/ui/Skeleton.astro) | Content that arrives *after* first paint (a client fetch, a heavy island) | Shimmer block sized to the content it replaces |

## The loader's personality is data, not five components

`LOADERS` in [`src/config.ts`](../../src/config.ts) maps a loader id → `{ lines, showBar, showBrand, motif }`, and each theme's `layout.loader` names one: `boot`/cyberpunk, `stream`/matrix, `latte`, `paper`, `signal`/broadcast — five distinct ids now, not four sharing a generic `fade`. The overlay is still **one component/one file** (`IntroLoader.astro`) — resist forking this into five — but `motif` picks a small theme-specific visual the component renders conditionally:

| motif | theme | what it is |
| --- | --- | --- |
| `hud` | cyberpunk | 4 CSS corner brackets around the panel + a looping scan-line sweep |
| `rain` | matrix | 16 columns of falling mono glyphs behind the panel, populated at runtime (`fillRainColumns`) from a fixed glyph pool — never real Katakana, just visual texture |
| `masthead` | latte | an italic serif `kicker` line + a rule that draws itself (`scaleX` 0→1) under the brand |
| `index` | paper | a large ticking Swiss-poster numeral (`00`→`100`, tabular-nums) that doubles as the progress indicator — paper has no `showBar` |
| `broadcast` | broadcast | 6 CSS color-bar stripes (TV test-pattern) + a blinking red "on air" dot next to the brand |

`latte` and `paper` still have **no lines and no bar** — an editorial/Swiss theme shouldn't pretend to boot a kernel; their motif carries the visual interest instead of boot-sequence text. Every optional element (`bar`, `lines`, `rule`, `count`) is therefore optional in the DOM, and GSAP throws on a null target, so `runBoot()` adds each tween only when its element rendered, and pads an otherwise-empty timeline so the brand scramble stays readable. **If you add a loader profile or a new motif, extend that same `if (el) tl.to(...)` list** — both in the main timeline and in the `reduced`-motion branch just above it, which sets every optional element straight to its finished state instead of animating.

New CSS-only motifs (`hud`'s scan sweep, `rain`'s fall animation, `broadcast`'s flicker/blink) rely on the global `@media (prefers-reduced-motion: reduce) { *, ::before, ::after { animation-duration: 0.001ms !important; ... } }` rule in `global.css` to go static for free — confirmed it covers `animation-duration` (not just `transition-duration`), so a plain `@keyframes` loop doesn't need its own reduced-motion guard. JS-driven motion (rain population, the GSAP tweens above) still needs the explicit `reduced` branch, since that rule can't reach inline JS timing.

## Why the boot loader must not run on navigation

It used to run on **every** `astro:page-load` plus `astro:before-preparation`, so every link click threw a full-screen overlay over content Astro had already fetched — making a fast site feel slow and hiding the page it just loaded.

The "cold document" test is **module scope**, not a flag in storage:

```ts
let hasBooted = false; // module-scoped
```

View Transitions swap the DOM but never re-evaluate a persisted script, so `hasBooted` survives navigation and the loader retires. A real reload re-evaluates the module, resetting it — which is exactly the intended trigger. Don't replace this with `sessionStorage`; a refresh *should* re-boot, and sessionStorage would suppress it.

## The failsafe must never depend on rAF

The original failsafe called `hideBoot()`, which animates via GSAP — i.e. via `requestAnimationFrame`. rAF is throttled or stopped entirely in a background tab, so the escape hatch could not fire in the one situation it existed for, leaving the overlay covering the page when the visitor returned.

Rules now enforced in `IntroLoader.astro`:

1. `forceHide()` writes `display:none` + state directly — **no GSAP, no rAF**. The timeout failsafe calls this, not `hideBoot()`.
2. If `document.visibilityState === 'hidden'` when the boot starts, skip the animation entirely and retire — nobody is watching, and the page should be ready the moment it's foregrounded.
3. `hideBoot()`'s fade still schedules a `forceHide()` shortly after its own duration, in case the tab is backgrounded mid-fade.

Any future animated overlay gets the same treatment: **the thing that guarantees escape cannot itself be animated.**

## NavProgress: don't flash on fast navigations

The bar waits `SHOW_DELAY` (180 ms) before appearing. Most local navigations resolve faster than that and show *nothing* — a bar that flashes for 80 ms reads worse than no bar. It creeps toward 90% and only reaches 100% on the real `astro:page-load`, so it never claims completion early. If it was never shown, `done()` resets silently.

## Skeleton: only for genuinely async content

A skeleton over server-rendered HTML is a lie — that content is already in the response. Current real use: the Hero's `Lanyard` island (`client:media`, three.js + rapier WASM), which leaves a hole in the layout while it downloads. A `MutationObserver` removes the skeleton the moment a `<canvas>` appears in the slot.

Before adding a skeleton, ask: *does this content arrive after first paint?* If the server already sent it, the answer is no.

## Verification notes

`document.visibilityState` is `hidden` in the automated browser pane, so it cannot observe the boot animation on a visible first load, and Astro's ClientRouter logs `InvalidStateError: Transition was aborted because of invalid state` there (the View Transitions API refuses to run on a hidden document). Neither is a bug in this code — verify boot visuals manually in a real window, and don't chase that console error in the pane.
