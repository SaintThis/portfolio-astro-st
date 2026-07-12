---
title: 'Anti-Patterns: The Ones I Keep Seeing in Web Development'
description: A field guide to the anti-patterns that show up over and over in web codebases — why they happen, how to spot them, and what to do instead.
date: 2026-07-08
tags: ['anti-patterns', 'software-engineering', 'code-quality']
draft: false
---

An anti-pattern isn't "bad code" — it's a *recognizable, repeated* solution to a common problem that looks reasonable in isolation and reliably causes damage as the codebase grows. Knowing the name is what lets you catch it in review before it's load-bearing.

## General programming anti-patterns

**God Object** — one class/module that knows about and touches everything (the "AppManager" that handles auth, logging, and business logic). It becomes the file nobody wants to touch and every PR conflicts on.

**Magic numbers and strings** — `if (status === 3)` instead of `if (status === OrderStatus.Shipped)`. The number works today; it's unreadable to the next person and a landmine the moment the enum's order changes.

**Copy-paste programming** — duplicating a block instead of extracting it, because extracting felt like overhead in the moment. Three near-identical copies later, a bug fix has to be applied three times and someone always misses one.

**Premature optimization** — restructuring code for performance before measuring, at the cost of readability, for a hot path that (per the profiler) was never actually hot.

**Golden Hammer** — reaching for the one tool/pattern you know well for every problem (Redux for a single boolean toggle; a microservice for a function that's called twice a day).

## Web-development-specific anti-patterns

### Prop drilling and giant God components

Covered in depth in [React in Production: Best Practices and the Anti-Patterns That Sneak In](/blog/react-best-practices-and-antipatterns) — but the pattern isn't React-specific. Any component-based UI (Vue, Svelte, Web Components) can grow a 500-line component that fetches, transforms, and renders three unrelated concerns, or thread props through layers that never use them.

### `!important` and specificity wars

```css
/* Antipattern: escalating specificity because the "real" fix requires
   understanding why the earlier override exists. */
.card .title { color: red !important; }
```

Every `!important` is a debt that compounds — the next developer who needs to override *this* rule reaches for `!important` too, because it's the only thing guaranteed to win. The fix is almost always: reduce selector specificity everywhere, and use a single source of truth for the property in question (a CSS custom property, as this site does for all color tokens).

### The N+1 fetch waterfall

```tsx
// Antipattern: fetch the list, then fetch each item's detail one at a time,
// each request waiting on the last to even start.
const posts = await getPosts();
for (const post of posts) {
  post.author = await getAuthor(post.authorId); // sequential, one round trip per post
}
```

This is the frontend's version of the classic N+1 query bug. The fix is to either batch the request (`getAuthors(ids)`), fetch in parallel (`Promise.all`), or — better — have the API return the shape the UI actually needs so there's one round trip, not N+1.

### Callback pyramids ("callback hell")

```js
// Antipattern
getUser(id, (user) => {
  getOrders(user.id, (orders) => {
    getInvoice(orders[0].id, (invoice) => {
      render(invoice); // four levels deep and still growing
    });
  });
});
```

`async`/`await` (or `Promise` chaining) exists specifically to flatten this. If you're still writing nested callbacks for asynchronous control flow in 2026, it's worth asking why.

### Boolean flag soup

```ts
// Antipattern: state that can represent impossible combinations.
const [isLoading, setIsLoading] = useState(false);
const [isError, setIsError] = useState(false);
const [data, setData] = useState<Data | null>(null);
// nothing stops isLoading === true AND isError === true AND data !== null at once
```

Three independent booleans can combine into eight states, most of which are invalid, and nothing in the type system says so. A discriminated union (`{ status: 'loading' } | { status: 'error'; error } | { status: 'success'; data }`) makes the invalid combinations impossible to construct instead of merely "shouldn't happen."

### Optimizing before profiling on the server side

Adding a cache layer, a queue, or a denormalized read model before a single metric shows the naive version is too slow. Sometimes it's warranted; often it's solving a problem that doesn't exist yet at the cost of real complexity — the server-side sibling of premature optimization above.

## The common thread

Every one of these looks like the fastest path to "it works" in the moment it's written. The tell is always the same: does this decision make the *next* change harder than it needed to be? If yes, it's probably one of the patterns above wearing a disguise.

## References

- [Refactoring Guru — Anti-Patterns](https://refactoring.guru/refactoring/smells) — code smells catalogued with before/after examples.
- [MDN — Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Specificity) — the actual mechanics behind the `!important` spiral.
- For video, search "code smells refactoring" or "callback hell to async await" — Fireship's and Web Dev Simplified's short-format explainers cover most of the patterns above in under ten minutes each.
