---
title: Building a Microfrontend That Actually Scales
description: Lessons from splitting a monolith into independently deployable remotes without drowning in coordination overhead — with Module Federation, React vs Next.js, and a diagram.
date: 2026-05-20
updated: 2026-07-13
tags: ['architecture', 'microfrontend', 'react', 'module-federation']
draft: false
---

Microfrontends are easy to sell and hard to get right. Here's what actually moved the needle when I led the MFE effort on a core product.

## Start from deploy independence, not code splitting

The goal isn't smaller bundles — it's letting teams ship on their own cadence. If two "remotes" can't deploy without coordinating, you have a distributed monolith with extra network calls.

## The shared contract is the product

- A single design-system version range, enforced in CI.
- A typed event bus for cross-remote communication — no reaching into each other's DOM.
- One source of truth for auth/session, injected at the shell.

## Measure the debt you're paying down

We tracked technical-debt tickets before/after and landed a **25% reduction** — not from the architecture alone, but from the code-review discipline it forced.

> Architecture is the set of decisions that are expensive to change later. Spend your review budget there.

## The mechanism: Module Federation

Everything above describes the *goal*. [Webpack Module Federation](https://module-federation.io/) (and its Rspack/Vite equivalents) is the mechanism that actually makes independently-deployed remotes possible in the browser: each remote exposes specific modules at build time, a host declares which remotes it consumes, and resolution happens **at runtime**, not at the host's build step.

```js
// remote (exposes a component)
new ModuleFederationPlugin({
  name: 'checkout',
  filename: 'remoteEntry.js',
  exposes: { './CheckoutForm': './src/CheckoutForm' },
  shared: ['react', 'react-dom'],
});

// host (consumes it)
new ModuleFederationPlugin({
  name: 'shell',
  remotes: { checkout: 'checkout@https://checkout.example.com/remoteEntry.js' },
  shared: ['react', 'react-dom'],
});
```

The `shared` config is the part teams get burned by: without it, every remote ships its own copy of React, and you pay for it in bundle size *and* in broken context/hooks across remote boundaries. With it, Module Federation dedupes compatible versions at runtime and negotiates a single shared instance.

## Traditional multi-app vs. Module Federation

| | Traditional (iframe / separate SPA per route) | Module Federation |
| --- | --- | --- |
| Deploy independence | Yes, but coarse — usually whole-route | Yes, at the component level |
| Shared state / auth | Hard — postMessage or duplicated login | Native — same JS realm, shared context works |
| Bundle duplication | High (each app ships its own React, design system) | Low — `shared` dedupes at runtime |
| Cross-remote UX | Jarring (reload, remount, iframe scroll issues) | Seamless — feels like one app |
| Coordination cost | Low upfront, high at integration points | Higher upfront (shared contract), low at runtime |
| Failure isolation | Strong (one iframe crashing doesn't take others down) | Weaker — a broken shared dependency can cascade |

Module Federation is the answer when the UX needs to feel like one product built by many teams. An iframe-per-app split is still the right call when isolation matters more than seamlessness (a third-party widget, a legacy app you don't want to touch).

## Why React specifically

React's win here isn't rendering speed — it's that **hooks and context are just JavaScript values passed across a module boundary**. A remote can consume a hook exposed by the shell (auth state, feature flags) the same way it consumes any other import, because Module Federation is federating *modules*, and a hook is a module export like any other. That's a much thinner integration surface than reimplementing a shared-state bridge for a framework where "state" is more tightly coupled to a specific rendering runtime instance.

## Why Next.js is often the wrong shell for this — specifically

This isn't "Next.js is bad" — it's that Next.js's core value (the App Router, React Server Components, server-driven data fetching) is built around **the framework owning the full request lifecycle**. Module Federation assumes the opposite: remotes resolved *at runtime, in the browser*, after the initial response is already out the door. The two models fight each other:

- **RSC boundaries don't federate.** A Server Component can't be "exposed" to a remote the way a client component can — federation is a client-side/webpack-runtime concept, and Next's biggest recent bet is moving rendering *off* the client.
- **Routing ownership conflicts.** Next.js wants to own routing end-to-end; a federated shell wants to hand routing decisions to whichever remote owns that URL segment, independently deployed from the shell.
- **Build-time optimizations assume a single build.** Next's bundling, image optimization, and prefetching are tuned for one cohesive build graph — federation's entire premise is *multiple independent build graphs* meeting at runtime.

None of this means Next.js is a bad framework — for a single-team product, it's an excellent default (this site's own author profile uses it elsewhere for exactly that reason). It means: if the reason you're reaching for microfrontends is genuine multi-team deploy independence, a plain React (or Vite + React) shell with Module Federation configured directly is a shorter path than fighting Next's assumptions about who owns the request.

## How it connects — a diagram

```text
┌─────────────────────────── Browser (one JS realm) ───────────────────────────┐
│                                                                                │
│   ┌─────────────────────────┐        remoteEntry.js (loaded at runtime)      │
│   │   Shell (host)          │◄───────────────────────────┐                   │
│   │   - Routing shell       │                             │                   │
│   │   - Auth/session        │        ┌────────────────────┴───────────────┐   │
│   │   - Shared design sys   │        │  Remote: "checkout"  (own repo/CI)  │   │
│   │   - shared: react@19    │        │  exposes ./CheckoutForm             │   │
│   └────────────┬────────────┘        │  shared: react@19 (deduped)         │   │
│                │                     └──────────────────────────────────────┘   │
│                │ imports ./CheckoutForm at runtime                              │
│                ▼                                                                │
│   ┌─────────────────────────┐        ┌────────────────────────────────────┐   │
│   │  Rendered page:         │        │  Remote: "profile"   (own repo/CI)  │   │
│   │  Shell chrome           │◄───────┤  exposes ./ProfileCard              │   │
│   │  + <CheckoutForm/>      │        │  shared: react@19 (deduped)         │   │
│   │  + <ProfileCard/>       │        └────────────────────────────────────┘   │
│   └─────────────────────────┘                                                  │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
   Each remote: own repo, own CI/CD, own deploy cadence.
   Shell: only ships routing + the shared contract (design system, auth, shared deps).
```

The picture worth remembering: the shell never bundles the remotes. It bundles a *reference* to where to find them, resolved when the page actually loads.

## References

- [Module Federation official docs](https://module-federation.io/) — the current home for Webpack/Rspack Module Federation, including the `shared` dependency negotiation model referenced above.
- [webpack.js.org — Module Federation concepts](https://webpack.js.org/concepts/module-federation/)
- For video, search "Module Federation explained" or "Zack Jackson Module Federation" — Zack Jackson (the feature's original author) has conference talks that walk through the shared-dependency negotiation in more depth than any doc page.

More war stories coming in the next post.
