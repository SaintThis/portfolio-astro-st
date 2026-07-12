---
title: 'TypeScript Interview Prep: The Questions That Actually Come Up'
description: Where TypeScript earns its keep in production, plus the interview questions I've actually been asked — with sample answers.
date: 2026-06-25
tags: ['typescript', 'interview', 'career']
draft: false
---

TypeScript interviews rarely ask you to recite the handbook. They ask you to reason about a type until it either clicks or falls apart. Here's what comes up in practice, with the kind of sample answer that survives a follow-up question.

## Where TypeScript actually earns its keep

- **API boundaries** — request/response shapes that can't silently drift between frontend and backend.
- **Refactors at scale** — renaming a field and letting the compiler find every call site, instead of grepping.
- **Public library surfaces** — `.d.ts` output is the contract consumers actually read.
- **Discriminated state** — modeling "loading / error / success" so an invalid combination is unrepresentable, not just undocumented.

## The questions

### 1. `interface` vs `type` — what's the real difference?

Both describe object shapes and both support generics. The practical differences: interfaces can be **declaration-merged** (re-opened and extended after the fact — useful for augmenting third-party types), and `type` can express unions, tuples, and mapped types that interfaces can't.

```ts
type Status = 'idle' | 'loading' | 'success' | 'error'; // interface can't do this

interface Window {
  myGlobal: string; // merges with lib.dom.d.ts's Window
}
```

Default to `interface` for object shapes you expect to extend; reach for `type` the moment you need a union.

### 2. Structural typing — why does this compile?

```ts
interface Point {
  x: number;
  y: number;
}
function log(p: Point) {
  console.log(p.x, p.y);
}
log({ x: 1, y: 2, z: 3 }); // ✅ compiles
```

TypeScript checks shape, not name or declared intent ("duck typing" with a compiler). Extra properties are fine on a variable; they're only rejected on an **object literal passed directly**, which is TypeScript's excess-property check catching likely typos.

### 3. `unknown` vs `any` — when do you reach for each?

`any` opts out of type checking entirely. `unknown` says "I don't know the type yet, but you must narrow it before you can use it" — safe by construction.

```ts
function parse(json: string): unknown {
  return JSON.parse(json);
}

const data = parse('{"id":1}');
if (typeof data === 'object' && data !== null && 'id' in data) {
  console.log(data.id); // narrowed, safe
}
```

Use `unknown` for anything crossing a trust boundary (API responses, `JSON.parse`, third-party input). `any` should be rare enough that a reviewer asks about it.

### 4. Write a generic that keeps the caller's type

```ts
function firstOf<T>(items: T[]): T | undefined {
  return items[0];
}

const n = firstOf([1, 2, 3]); // number | undefined
const s = firstOf(['a', 'b']); // string | undefined
```

The interview follow-up is usually: *"what happens without the generic?"* — you'd fall back to `any[]` or a union of every type ever passed in, losing the relationship between input and output entirely.

### 5. Know the built-in utility types cold

```ts
interface User {
  id: string;
  name: string;
  email: string;
}

type NewUser = Omit<User, 'id'>; // creation payload, no id yet
type UserPatch = Partial<User>; // PATCH body
type UserSummary = Pick<User, 'id' | 'name'>; // list view
type UsersById = Record<string, User>; // lookup table
```

`Partial`, `Pick`, `Omit`, and `Record` cover the majority of real-world DTO shaping — knowing them by name (not reinventing them) is usually the actual bar.

### 6. Discriminated unions for state that can't be invalid

```ts
type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

function render<T>(state: FetchState<T>) {
  switch (state.status) {
    case 'success':
      return state.data; // narrowed — .data only exists here
    case 'error':
      return state.error; // narrowed — .error only exists here
    default:
      return null;
  }
}
```

This is the pattern interviewers most want to see: a `data`/`error` pair that's *always* optional on a flat type lets you render loading UI with stale error text still attached. A discriminated union makes that state impossible to construct.

### 7. `as const` — what does it actually lock down?

```ts
const THEMES = ['cyberpunk', 'matrix', 'synthwave'] as const;
type ThemeId = (typeof THEMES)[number]; // 'cyberpunk' | 'matrix' | 'synthwave'
```

Without `as const`, `THEMES` widens to `string[]` and `ThemeId` collapses to `string`. This exact pattern drives this site's own theme registry in [`config.ts`](https://github.com/SaintThis/portfolio-astro-st/blob/main/src/config.ts) — one array, a derived union type, zero duplication.

## A small live challenge

A common whiteboard variant: implement `groupBy` with a signature that infers the key type from the callback, not from a manual generic parameter.

```ts
function groupBy<T, K extends string | number>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}
```

The thing worth saying out loud while you write it: `K` is inferred from `keyFn`'s return type, so the caller never has to spell out a generic argument.

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — the canonical source, worth reading start to finish once.
- [TypeScript Utility Types reference](https://www.typescriptlang.org/docs/handbook/utility-types.html)
- [Total TypeScript](https://www.totaltypescript.com/) (Matt Pocock) — free exercises specifically built around this style of interview question.
- For video, search "TypeScript generics explained" or "discriminated unions TypeScript" — Matt Pocock's and the official Microsoft TypeScript channel's talks on these two topics are the ones I keep sending people back to.
