---
title: 'Deno Fresh vs. Next, Astro & SvelteKit: What Zero-Build Islands Buy You'
description: No bundler, no node_modules to babysit, islands that ship almost no JavaScript — what Fresh genuinely nails, where Next.js and Astro still win, and the lessons from building a full marketplace on it.
date: 2026-07-25
tags: ['deno', 'fresh', 'preact', 'islands', 'web-frameworks']
category: 'frontend'
cover: /uploads/hero-deno-fresh.svg
featured: true
draft: false
---

Every meta-framework in 2026 is quietly converging on the same admission: most of the JavaScript we ship never needed to run in the browser. Next.js arrived there through React Server Components; Astro through islands. Deno Fresh got there first and more bluntly than either — it ships **zero** client JavaScript by default, has **no build step to configure**, and treats a component that hydrates as the exception you opt into, not the default you spend your day fighting to avoid.

I built [Sundry](/projects/sundry), a full buy/sell/boost marketplace, on Fresh specifically to find out whether "first and bluntest" also means "best." Here's what it genuinely nails — and where Next.js and Astro still have its number.

## What Fresh gets genuinely right

- **No build step you have to babysit.** There's no `webpack.config`, no `vite.config`, no bundler to appease — you run `deno task dev` and edit files. Fresh compiles islands on demand with esbuild under the hood, but that machinery never becomes your problem. After years of framework configs that rot, "there is no config to rot" is a real feature.
- **Islands are the default posture, not an escape hatch.** A Fresh route renders to HTML on the server and ships nothing to the client unless you explicitly drop a component into `islands/`. You don't opt *out* of shipping JavaScript; you opt *in*, one interactive leaf at a time. That inverts the incentive every SPA framework gets backwards.
- **It's Deno-native, so the platform is the toolchain.** TypeScript, JSX, formatting, linting, testing, and a permissioned runtime are all built in. No `node_modules` archaeology, no `@types/*` scavenger hunt, no separate test runner to wire up — `deno task check` is fmt + lint + typecheck in one.
- **Preact, not React — and you feel the ~4KB.** Fresh renders with Preact, so even a page full of islands ships a fraction of React's runtime. On a marketplace grid where most of the page is static product cards, that difference is the whole point.

Hold onto that second bullet — **islands are opt-in** — because it's simultaneously Fresh's best idea and the thing people misuse first.

## The islands model, in practice

On Sundry, the split fell out naturally. The product grid, category rails, seller cards, and price tags are plain server-rendered components — zero client JS. Only three things are islands: the cart drawer, the sort/filter controls, and the theme toggle. Cross-island state (the cart, the theme) rides on `@preact/signals`; everything else — filters, sort, tabs, the search query — lives in the URL, so every view is shareable and the back button just works.

The trap is treating an island like a React page. It looks like ordinary Preact, so the reflex is to wrap a whole screen in one and move on:

```tsx
// Antipattern: the entire page is one island, so Fresh hydrates
// the whole tree — you've rebuilt a client-rendered SPA and paid
// for the islands architecture without using it.
// islands/ProductPage.tsx
export default function ProductPage({ product, related }) {
  return (
    <main>
      <Gallery images={product.images} />   {/* static — didn't need JS */}
      <Description text={product.description} /> {/* static */}
      <AddToCart product={product} />        {/* the ONLY interactive bit */}
      <RelatedGrid items={related} />        {/* static */}
    </main>
  );
}
```

The fix is the framework's actual model — render the page on the server, and make an island of *only* the interactive leaf:

```tsx
// routes/product/[slug].tsx — server-rendered, ships no JS…
export default function ProductPage(props) {
  const { product, related } = props.data;
  return (
    <main>
      <Gallery images={product.images} />
      <Description text={product.description} />
      <AddToCartButton product={product} />  {/* island — the only hydrated thing */}
      <RelatedGrid items={related} />
    </main>
  );
}
```

Now the byte you ship maps to the interactivity you actually have. This is the same instinct behind Astro's "prefer zero-JS" rule that backs [this very site's stack](/blog/serverless-stack-astro-workers-r2-neon) — the framework changes, the discipline doesn't.

## Where Next, Astro, and SvelteKit still win

Praise-first cuts both ways — the honest comparison is that Fresh loses some rounds:

- **Next.js owns the ecosystem and the data story.** React Server Components let you `await` your database inside a component and stream the result, with a decade of libraries, hosting, and hiring pipeline behind it. Fresh's data-loading is deliberately humble by comparison: a route handler puts data in `props`, and you render it. For a large app with a big team, "boring and well-trodden" is worth a lot, and that's Next's to lose.
- **Astro is the better fit when content is the point — and when you want React itself.** Astro also does islands, but ships a *build* pipeline (Vite), first-class Markdown/content collections, and lets you drop in React, Vue, *and* Svelte components side by side. If your site is 90% content with occasional interactivity — a blog, a docs site, a marketing site — Astro's authoring story is richer than Fresh's. (It's what you're reading this on.)
- **SvelteKit ships the least JavaScript of anyone when a page *is* interactive.** Svelte's compiler-first model means a genuinely app-like, heavily-interactive page can undercut even a Preact island on bundle size. Fresh wins on the *static* majority of a page; SvelteKit wins when most of the page truly needs to move.

Fresh's sweet spot is the shape in between: a real, routed **application** that's mostly server-rendered with pockets of interactivity — exactly Sundry's shape — where you want an SPA's structure without an SPA's payload.

## Where Fresh bites

The trade-offs are real, and worth naming before you commit:

- **The ecosystem is small and Preact-shaped.** You're not pulling arbitrary React libraries off the shelf; many assume React internals, and the Preact-compat layer is a sometimes-thing. On Sundry that was fine — I wrote the components — but a team leaning on a big component library will feel the walls.
- **The dependency model is different, not free.** `esm.sh` URLs and `npm:`/`jsr:` specifiers replace `package.json`, which is genuinely cleaner until a transitive dependency misbehaves and you're debugging a URL instead of a lockfile entry.
- **Framework churn is a live cost.** Fresh 2.x reworks parts of the model (from the 1.7 line Sundry targets), so tutorials and answers drift out of date faster than in the React world. You're adopting a smaller, faster-moving thing — that's the deal.
- **No RSC-style "await the DB in a component."** Data lives in route handlers and flows down as props. It's clean, but if you've internalized the RSC pattern, expect to unlearn a reflex.

## The takeaway

Fresh isn't trying to beat Next.js at being Next.js, and reading it that way is the mistake. Its bet is narrower and sharper: **the browser should receive HTML, and JavaScript should be the exception you justify** — enforced by a runtime with no build step to get in the way. That bet pays off hardest for a routed application that's mostly static with real-but-contained interactivity, which is a huge share of the apps people actually build.

So the framework question isn't "which is best" — it's "what's your page made of." Mostly content? Astro. Mostly interaction? SvelteKit. A big app with a big team and a deep React bench? Next. A server-rendered application where you want the shelves static and only the cart to move? That's the Fresh-shaped hole, and it fills it better than anything else I've reached for.

## References

- [fresh.deno.dev — the Fresh docs](https://fresh.deno.dev/docs/introduction) — the islands model, routing, and the "no build step" claim, straight from the source.
- [Deno's islands explainer](https://deno.com/blog/intro-to-fresh) — the original case for shipping HTML first and hydrating leaves, with the reasoning behind the default.
- [Astro's Islands Architecture writeup](https://docs.astro.build/en/concepts/islands/) — the same idea from the framework that popularized the term; useful for seeing where Fresh and Astro converge and diverge.
- [Sundry](/projects/sundry) — the marketplace these lessons came from: Fresh 1.7, `@preact/signals`, URL-driven state, and a mock-but-swappable repository layer.
- For the broader "prefer zero-JS" discipline that outlives any one framework, see [the stack behind this site](/blog/serverless-stack-astro-workers-r2-neon).
