# Astro / Vite dev-server best practices

Linked from [`CLAUDE.md`](../../CLAUDE.md). Read this before adding a new npm dependency, a new `client:*` island, or touching `astro.config.mjs` — it exists so the same class of dev-only crash (see incident below) doesn't happen again, and so build/dev/run errors get logged instead of re-diagnosed from scratch.

## Incident this rule file exists because of

**2026-07-18** — `npm run dev` threw repeated `Invalid hook call` / `Cannot read properties of null (reading 'useRef'/'useState'/'useCallback')` from `Cursor.tsx`, `ThemeSwitcher.tsx`, `Sidebar.tsx`, `Lanyard.tsx` on first load. `npm ls react react-dom` showed a single deduped `react@19.2.7` — **not** a duplicate-React-copy bug. The real cause: `Lanyard.tsx` (`src/components/react/Lanyard.tsx`) pulls in `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, `meshline` — heavy deps Vite doesn't discover until the first request renders `Hero.astro`. That triggers a **mid-session** `[vite] Re-optimizing dependencies` pass, which invalidates the SSR module graph *while a request is still in flight*, so the in-flight request's React import resolves to a stale/half-swapped module instance. Full log preserved in [`.claude/known-errors.md`](../known-errors.md).

**Fix applied**: `astro.config.mjs` → `vite.optimizeDeps.include` now lists every dep actually imported by a `client:*` island (react, react-dom, zustand(+/middleware), motion/react, gsap(+/ScrollTrigger), three, r3f, drei, rapier, meshline, @base-ui/react, clsx, tailwind-merge), so Vite pre-bundles all of them **at cold start**, before any request can race a mid-session re-optimization.

## Rule: every new client-side dependency gets registered

If you add an npm package **and it is imported from any file under `src/components/react/*.tsx`** (or from a `.astro` file that isn't purely server-rendered), add its bare specifier to `vite.optimizeDeps.include` in `astro.config.mjs` in the **same commit**. Include subpath imports too if the code uses them (e.g. `zustand/middleware`, `gsap/ScrollTrigger`, `motion/react`) — Vite optimizes each specifier independently.

Skip this only for deps that are server-only (used exclusively in `.astro` frontmatter / API routes with no client hydration) — those never hit the SSR/client race described above.

## Rule: dev server needs a manual restart after certain changes

Astro's dev server hot-reloads most edits, but these require a full stop/restart (not just an HMR reload) because they change what gets pre-bundled or how the content/type layer is generated:

- Editing `astro.config.mjs` (integrations, `vite.*`, `env.schema`, adapter config).
- Adding a brand-new npm dependency that's imported by a `client:*` island for the first time.
- Editing `src/content.config.ts` (collection schemas) — the content layer caches the schema; stale types otherwise.
- Adding/renaming an `envField` in the `env.schema` block.

## Rule: dev-only crash (not a build failure) → clear caches before deep debugging

If `npm run build` / `npm run check` pass but `npm run dev` throws something that looks like a stale-module or hook-order error (`Invalid hook call`, `Cannot read properties of null`, "does not provide an export named X", weird HMR desync), the fastest and usually-correct first move is:

```bash
# stop the dev server first, then:
rm -rf node_modules/.vite node_modules/.astro
npm run dev
```

This clears Vite's SSR + client dependency caches, which is what actually caused the incident above. Only dig into "duplicate React copy" (`npm ls react react-dom`) or version-mismatch theories if the crash survives a clean cache.

## Rule: log every new error class before/while fixing it

Before closing out any dev/build/run error that isn't already covered in [`.claude/known-errors.md`](../known-errors.md), add an entry there: symptom (short), root cause, fix applied, date. Check that file first when a new error shows up — it may already be diagnosed.

## General Astro best practices (apply to every feature/prompt, not just this incident)

- **Hydration cost is a first-class design constraint.** Before adding a new `client:*` island, ask whether it could be a zero-JS `.astro` component instead (golden rule #4 in `CLAUDE.md`). If it must be an island, pick the laziest directive that works, and if it pulls in a heavy library (3D, charting, animation-heavy), gate it behind `client:visible` or `client:media` the way `Lanyard.tsx` does — never `client:load` for anything but `Cursor.tsx`.
- **`astro check` after every edit, not just at the end** — it's faster than a full build and catches type errors, content-schema mismatches, and prop-type errors immediately (see [`verification-protocol.md`](verification-protocol.md)).
- **Content collections, not ad-hoc fetches, for Markdown.** Blog posts go through `astro:content` / `getCollection('blog')` — see [`data-flow.md`](data-flow.md). Don't hand-parse Markdown files.
- **`export const prerender = false` is an opt-in per route**, not a global switch — `output` stays `'static'` (see `CLAUDE.md` gotchas). Only flip a route to on-demand SSR when it genuinely needs live/DB data at request time; static pages stay static for the CDN/caching win.
- **Don't hardcode ports, colors, or site strings.** Ports/dev config live in `.claude/launch.json`; colors are semantic tokens ([`theme-tokens.md`](theme-tokens.md)); site strings live in `src/config.ts` (golden rule #3).
- **Scripts that touch the DOM re-init on `astro:page-load`**, guarded against double-binding — View Transitions swap the DOM without a full reload (golden rule #6). This applies to any new inline `<script>`, not just existing ones.
