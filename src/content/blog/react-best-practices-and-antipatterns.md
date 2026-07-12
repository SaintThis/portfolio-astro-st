---
title: 'React in Production: Best Practices and the Anti-Patterns That Sneak In'
description: What React is genuinely good at, the practices that keep a codebase healthy, and how the same flexibility that makes React powerful lets antipatterns hide in plain sight.
date: 2026-07-02
tags: ['react', 'best-practices', 'frontend']
draft: false
---

React's pitch is simple: components as functions of state. That simplicity is also the trap — the library has almost no opinions, so a team's discipline (or lack of it) shows up directly in the codebase within a few sprints.

## Where React genuinely earns its reputation

- **Composable UI at scale** — small components that combine into pages without a templating layer fighting you.
- **A huge, stable ecosystem** — routing, forms, data-fetching, animation all have mature, interoperable answers.
- **Concurrent rendering** — `useTransition` and `Suspense` let you keep a UI responsive while heavy updates happen in the background, without hand-rolled scheduling.
- **One mental model everywhere** — the same component/hook shape works for a marketing page island and a full SPA dashboard.

## Best practices that actually prevent pain later

1. **Colocate state with the component that owns it.** Lift state only when two siblings genuinely need to share it — not preemptively "in case."
2. **Derive, don't duplicate.** If a value can be computed from existing state during render, compute it. A second `useState` that mirrors another one is a bug waiting for an update to be missed.
3. **Keep effects for synchronization with the outside world** (subscriptions, DOM APIs, network) — not for propagating state that render could compute directly.
4. **Name your custom hooks by what they do, not what they use.** `useDebouncedSearch`, not `useEffectAndState`.
5. **Stable, meaningful `key`s on lists** — the key is an identity contract with the reconciler, not a formality.

```tsx
// Derived state — no effect, no second state variable, no lag.
function Cart({ items }: { items: Item[] }) {
  const total = items.reduce((sum, i) => sum + i.price, 0); // computed every render, always correct
  return <p>Total: {total}</p>;
}
```

## The double-edged sword: where the same flexibility becomes an antipattern

React won't stop you from writing something that works today and rots in three months. The most common ways that happens:

### `useEffect` as a state-sync sledgehammer

```tsx
// Antipattern: an effect just to keep one state in sync with another.
const [items, setItems] = useState<Item[]>([]);
const [total, setTotal] = useState(0);
useEffect(() => {
  setTotal(items.reduce((s, i) => s + i.price, 0));
}, [items]);
```

This renders twice (once with the stale total, once after the effect fires), and it's an extra place a bug can hide if `items` changes somewhere the effect doesn't expect. Compute `total` during render instead — see the `Cart` example above.

### Prop drilling past the point of readability

Passing `theme`, `user`, and `onLogout` through five layers of components that don't use them themselves is a sign the data belongs in context, a store, or a composition change (passing the rendered child instead of the data needed to render it).

### `key={index}`

```tsx
// Antipattern: index as key on a list that can reorder or filter.
{todos.map((todo, i) => <TodoRow key={i} todo={todo} />)}
```

The moment the list is reordered, filtered, or an item is deleted from the middle, React matches the wrong DOM node to the wrong item — internal state (like an open `<input>` with a half-typed value) can end up attached to the wrong row. Key by a stable ID.

### The 500-line "God component"

A component that fetches, transforms, and renders three unrelated concerns is the CSS/JS equivalent of a God Object — see [Anti-Patterns: The Ones I Keep Seeing in Web Development](/blog/antipatterns-in-web-development) for the general case. The fix is almost always extracting a hook for the data logic and splitting the render into components that each answer one question.

### Context used as a global state bucket

Context solves prop drilling; it doesn't solve state management. A single giant context object that re-renders every consumer on every change is often slower and harder to reason about than the prop drilling it replaced. For anything that changes frequently or independently, a store (Zustand, Redux) or splitting into multiple smaller contexts scoped to what actually changes together is the better fit.

## The pragmatic takeaway

React being unopinionated is a feature for experienced teams and a liability for teams without a shared standard. Most of the "React is a mess" complaints trace back to one of the patterns above, not to the library itself.

## References

- [react.dev — Thinking in React](https://react.dev/learn/thinking-in-react)
- [react.dev — You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) — the single best antidote to effect-as-sledgehammer code.
- [react.dev — Reference: useTransition](https://react.dev/reference/react/useTransition)
- For video, search "You Might Not Need an Effect" or "Rules of React" — talks from React Conf (available on react.dev's conference page) walk through these exact antipatterns with real diffs.
