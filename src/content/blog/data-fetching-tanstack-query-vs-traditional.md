---
title: 'Data Fetching Strategy: TanStack Query vs. Traditional useEffect + fetch'
description: What you actually give up with useEffect-and-fetch, what TanStack Query buys you, and how to tell which one your project needs today.
date: 2026-07-13
tags: ['react', 'tanstack-query', 'data-fetching']
draft: false
---

Every React data-fetching debate eventually reduces to one question: is your data-fetching logic a *side effect* or is it *state you're managing*? Treat it as the first and you'll hand-roll the second, badly.

## The traditional approach

```tsx
// Traditional: useEffect + fetch
function UserProfile({ id }: { id: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/users/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <Spinner />;
  return <Profile user={user} />;
}
```

This looks complete, and it isn't:

- **No caching** — navigate away and back, and it refetches from zero every time.
- **No deduplication** — two components fetching the same `id` fire two identical requests.
- **No retry/backoff** — a flaky network means the user sees the error, once, with no recovery.
- **Race conditions are manual** — the `cancelled` flag above is you hand-rolling what a library solves once, correctly, for everyone.
- **No shared invalidation** — after a mutation, every component holding stale data needs to be told to refetch, manually.

## What TanStack Query buys you

```tsx
// TanStack Query
function UserProfile({ id }: { id: string }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetch(`/api/users/${id}`).then((r) => r.json()),
  });

  if (isLoading) return <Spinner />;
  return <Profile user={user} />;
}
```

Same UI, and for free: request deduplication by `queryKey`, in-memory caching with configurable staleness, automatic retry with backoff, refetch-on-window-focus/reconnect, and a devtools panel that shows exactly what's cached and why it did or didn't refetch. Mutations get `invalidateQueries` — one call tells every component holding that key to refetch, instead of you tracking who needs to know.

## When the traditional approach is still the right call

Not every project needs a query library on day one. This site's own [`lib/api/http.ts`](https://github.com/SaintThis/portfolio-astro-st/blob/main/src/lib/api/http.ts) is a deliberately tiny typed `fetch` wrapper — no cache, no retries — with a comment that says exactly why:

> Kept intentionally tiny — swap for openapi-fetch / ky / tanstack-query if the surface grows.

That's the right call when:

- Data is fetched **once per page**, mostly at build time (this site is `output: 'static'` — there's no client-side cache to manage because there's no client-side fetch in the steady state).
- There's **no shared server state to synchronize** across components — one component wants one thing once.
- Adding a dependency and its devtools bundle costs more than the problem it solves *today*.

The mistake isn't choosing a plain fetch — it's still using a plain fetch after the app has grown three components that all need the same data kept in sync, refetched on mutation, and cached across navigations. That's the point where hand-rolling `cancelled` flags and lifting state up five levels costs more than the ~14kb TanStack Query adds.

## A rule of thumb

| Signal | Reach for |
| --- | --- |
| One-off fetch, no reuse, static/SSG page | Plain `fetch` (or a thin wrapper like `apiGet`) |
| Same data needed in 2+ places, must stay in sync | TanStack Query |
| Data changes via mutation and other views must reflect it | TanStack Query (`invalidateQueries`) |
| Offline support, background refetch, retry/backoff needed | TanStack Query |
| Server Components doing the fetch at request time | Neither — fetch directly in the server component, no client cache needed |

## References

- [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/overview)
- [TanStack Query — Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) — the staleTime/cacheTime behavior that trips people up first.
- [react.dev — Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects#fetching-data) — React's own docs walking through why the naive `useEffect` fetch needs the cleanup/race-condition handling shown above.
- For video, search "TanStack Query crash course" — Jack Herrington's and the official TanStack channel's walkthroughs are the ones that map most directly to the migration path described here.
