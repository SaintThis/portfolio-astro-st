# Known errors log

Linked from [`CLAUDE.md`](../CLAUDE.md) and [`astro-vite-best-practices.md`](rules/astro-vite-best-practices.md). Running log of real dev/build/run errors seen in this project — check here **first** when a new error appears, it may already be diagnosed. Append new entries at the bottom (newest last), same format: date + short symptom as the heading, then Symptom / Diagnosis / Fix / Files touched.

Kept as `.md` (not `.txt`) deliberately — this repo's session tooling auto-loads every `.md` file linked from `CLAUDE.md` into context at the start of each session; a plain-text file wouldn't get that treatment. See [`rule-generation.md`](rules/rule-generation.md).

---

## 2026-07-18 — Invalid hook call / `useRef` on null (Vite dependency re-optimization race)

**Command:** `npm run dev`

**Symptom:**

Repeated console errors right after dev server start / first page load:

```
[ERROR] [vite] Invalid hook call. Hooks can only be called inside of the
body of a function component...
[ERROR] [vite] TypeError: Cannot read properties of null (reading 'useRef')
  at Cursor (src/components/react/Cursor.tsx:51:18)
```

...same pattern for `ThemeSwitcher.tsx` (`useCallback` via zustand), `Sidebar.tsx` (`useState`), `Lanyard.tsx` (`useState`). Preceded in the log by:

```
[vite] Re-optimizing dependencies because vite config has changed
[vite] dependency optimized: astro/env/runtime / astro/zod
[vite] optimized dependencies changed. reloading
[vite] [vite] program reload
```

**Diagnosis:**

Ran `npm ls react react-dom` — confirmed only **one** deduped copy of `react@19.2.7` across the whole tree (`@astrojs/react`, `@base-ui/react`, `@react-three/*`, `motion`, `zustand`, `react-dom` all resolved to the same instance). So this was **not** the classic "two copies of React" cause.

Actual cause: `src/components/react/Lanyard.tsx` imports `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, and `meshline` — heavy deps Vite's optimizer doesn't discover until the first request actually renders `Hero.astro` (which mounts `Lanyard`). That late discovery forces Vite to stop and re-optimize dependencies **mid-session**, which invalidates the SSR module graph while a request is still in flight — so React (and zustand, which itself calls React hooks) resolve against a stale/half-swapped module instance for that in-flight render. Classic Vite+Astro cold-start race, not a code bug in the components.

**Fix:**

1. `astro.config.mjs` — added `vite.optimizeDeps.include` listing every dep actually imported by a `client:*` island (`react`, `react-dom`, `react-dom/client`, `react/jsx-runtime`, `zustand`, `zustand/middleware`, `motion/react`, `gsap`, `gsap/ScrollTrigger`, `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, `meshline`, `@base-ui/react`, `clsx`, `tailwind-merge`). Forces eager pre-bundling at cold start instead of lazy mid-session discovery.
2. Cleared stale caches: `rm -rf node_modules/.vite node_modules/.astro`
3. Verified: `npm run check` → 0 errors/warnings. `npm run build` → clean, 0 errors. Production build served via wrangler (`astro-preview`, port 4322) rendered the homepage (Hero + Lanyard's parent tree) with zero console/server errors.

Note: could not reproduce/re-verify against the actual `astro dev` server (port 4321) because it was already occupied by the user's own terminal session (the one that produced this error log) — did not kill it without asking. If this error recurs after a normal `npm run dev` restart, the first move is still: stop the server, delete `node_modules/.vite` and `node_modules/.astro`, restart (see [`astro-vite-best-practices.md`](rules/astro-vite-best-practices.md)).

**Files touched:** `astro.config.mjs`

---

## 2026-07-16 / 2026-07-21 — Cloudflare `npm ci` EUSAGE: lockfile out of sync (recurred twice)

**Command:** Cloudflare's build step, `npm clean-install --progress=false`

**Symptom:**

```
npm error code EUSAGE
npm error `npm ci` can only install packages when your package.json and
npm error package-lock.json or npm-shrinkwrap.json are in sync. Please update
npm error your lock file with `npm install` before continuing.
npm error
npm error Missing: @emnapi/runtime@1.11.2 from lock file
npm error Missing: @emnapi/core@1.11.2 from lock file
```

Build fails at the install step, before anything else runs.

**Diagnosis:**

Local machine's global npm is **11.x**; Cloudflare's build image uses **npm 10.9.2** (confirmed via its own log line: `Detected the following tools from environment: nodejs@X, npm@10.9.2`). Any `npm install` run locally with npm 11 regenerates `package-lock.json` with different hoisting for `@emnapi/core`/`@emnapi/runtime` (transitive deps of Astro's WASM image tooling, `sharp`/`@img`) — npm 11 nests them under sub-dependencies instead of hoisting them to the top level, which is what npm 10's `npm ci` expects to find. Since `npm ci` requires an *exact* match, not just a resolvable tree, this fails immediately.

Triggered both times by a routine local `npm install`/`npm i <pkg>` — first when adding backend packages, second from `npm i wrangler` while troubleshooting the Cloudflare secret. Neither time involved editing `package.json` by hand or anything unusual — **any** local install regenerates the lock in the wrong shape.

**Fix:**

Regenerate the lock using npm 10.9.2 specifically (matches Cloudflare exactly), then verify with the same command Cloudflare runs:

```bash
npx --yes npm@10.9.2 install --no-audit --no-fund
npx --yes npm@10.9.2 ci --dry-run --no-audit --no-fund   # must show no EUSAGE
npm run build                                             # sanity check
```

**Prevention:** `.node-version` (pinned to `22`) was added after the first occurrence specifically to keep Cloudflare's Node major aligned with local — but it does **not** pin the npm minor/major, so this can still recur after any local `npm install`. After running `npm install`/`npm i <pkg>` locally, always re-sync with `npx npm@10.9.2 install` before pushing (or ask the agent to do it) — don't assume a normal install is safe to push as-is.

**Files touched:** `package-lock.json` (both times), `.node-version` (added on first occurrence)

---

## 2026-07-21 — Cloudflare deploy fails: `The "legacy_env" field is no longer supported`

**Command:** Cloudflare's deploy step, `npx wrangler deploy` (also reproducible locally via `npx wrangler deploy --dry-run` — safe, doesn't publish)

**Symptom:**

Install and `npm run build` both succeed (this is the *next* failure after the `npm ci` lockfile issue above is fixed) — the build log even prints `[build] Complete!` — then:

```
Executing user deploy command: npx wrangler deploy
✘ [ERROR] Processing dist/server/wrangler.json configuration:
    - The "legacy_env" field is no longer supported, so please remove it from
      your configuration file.
Failed: error occurred while running deploy command
```

**Diagnosis:**

`dist/server/wrangler.json` is auto-generated by `@astrojs/cloudflare` at build time (redirected from the repo's own `wrangler.jsonc`, which does **not** contain `legacy_env` — confirmed by inspecting it directly). The `legacy_env: true` field is injected by **wrangler's own** internal config-normalization code (found inside `node_modules/wrangler/wrangler-dist/cli.js`, not in the adapter), as a default for configs with no `[env.*]` blocks. That's normal — the bug is that a *newer* deploy-time config validator, introduced in `wrangler@4.111.0` or `4.112.0` (both tested; `4.110.0` does not have this validator), now rejects that same field it itself writes. A same-package internal regression, not an `@astrojs/cloudflare` bug — confirmed by downgrading only `wrangler` (adapter version unchanged) and watching the error disappear.

Surfaced only now because every earlier deploy this project attempted failed at the `npm ci` step first (see the entry above) — this failure mode was latent as soon as `wrangler` got bumped past `4.110.0` (via a routine `npm i wrangler`), but nothing reached the deploy step to reveal it until the lockfile issue was fixed.

**Fix:**

Pin `wrangler` to an exact known-good version (not a caret range, which would silently float back into the broken range on a future `npm install`):

```bash
npm install -D wrangler@4.110.0   # then edit package.json: "wrangler": "4.110.0" (no ^)
npx --yes npm@10.9.2 install --no-audit --no-fund      # resync lock for Cloudflare
npx --yes npm@10.9.2 ci --dry-run --no-audit --no-fund # must show no EUSAGE
npm run build
npx wrangler deploy --dry-run                            # must show bindings, no legacy_env error
```

**Prevention:** `wrangler` is intentionally pinned exact (no `^`) in `package.json` now — don't loosen it back to a caret range without re-testing `wrangler deploy --dry-run` against whatever newer version you're moving to. Re-check `npm view wrangler versions` periodically; a future wrangler release may fix this upstream, at which point the pin can be bumped deliberately.

**Files touched:** `package.json` (`wrangler` pinned to `4.110.0` exact), `package-lock.json`
