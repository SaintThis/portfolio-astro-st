# Loading states

Linked from [`CLAUDE.md`](../../CLAUDE.md). Read this before adding, moving, or "improving" any loading UI — the three states below have deliberately different jobs, and collapsing them back into one is the regression this file exists to prevent.

## The three tiers

| Tier | Component | Fires when | Looks like |
| --- | --- | --- | --- |
| Global | [`layout/IntroLoader.astro`](../../src/components/layout/IntroLoader.astro) | **Cold document only** — first visit, hard refresh, direct URL hit | Full-viewport terminal boot sequence |
| Navigation | [`layout/NavProgress.astro`](../../src/components/layout/NavProgress.astro) | Client-side navigation (View Transitions) that takes **> 180 ms** | 2px accent bar pinned to the top edge |
| Async region | [`ui/Skeleton.astro`](../../src/components/ui/Skeleton.astro) | Content that arrives *after* first paint (a client fetch, a heavy island) | Shimmer block sized to the content it replaces |

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
