# CLAUDE.md

Guidance for Claude (and other AI agents) working in this repo. Keep changes consistent with what's already here.

## What this is

A cyberpunk/coder-themed **Astro 7** portfolio. Static-first, islands for interactivity, multi-theme, SEO-complete, and structured so a real API can replace example data with minimal changes. Read `ARCHITECTURE.md` and `DESIGN.md` before non-trivial work.

## Commands

```bash
npm run dev        # dev server @ 4321
npm run build      # astro check + build — MUST pass before you call a task done
npm run check      # types/diagnostics only (faster than build)
npm run format     # prettier
```

Always run `npm run build` (or at least `npm run check`) after edits. The build type-checks Astro + TS and will catch most mistakes.

## Command phrases (session boundaries)

This repo uses a small set of **command phrases** so any AI agent — Claude or otherwise — recognizes the same session boundaries the same way, without depending on a tool-specific feature (like a chat UI's own "mark chapter" affordance, which is not a commit and won't survive outside that UI). Match phrases as whole words, case-insensitively, wherever they appear in a message — not just at the start of a line.

| Phrase | Meaning | Agent behavior |
| --- | --- | --- |
| `session start: <description>` | Begin a new unit of work | Treat `<description>` as the task for everything that follows. Do **not** commit anything yet — just do the work. If the description is missing (just `session start`), infer the task from the rest of the message. |
| `session end` | Close out the current unit of work | Stage **only the files actually touched** since the matching `session start` (never a blanket `git add -A`/`git add .`) and create one git commit. This phrase *is* the explicit user request to commit — it satisfies "only commit when asked," it doesn't bypass it. |

**Commit format on `session end`:**

- **Title**: short imperative summary of what changed (derived from the `session start` description if one was given, otherwise from the diff) — matches this repo's existing commit style (see `git log`).
- **Body**: a bullet list, one bullet per distinct change or file group — not a restatement of the title, and not prose paragraphs.
- Follow the repo's normal commit conventions otherwise (new commit, never `--amend`; never `--no-verify`; don't push unless separately asked).

**Edge cases:**

- `session end` with no preceding `session start` in the conversation → commit whatever is currently uncommitted, with a message inferred from the diff.
- `session end` with nothing changed → say so; never create an empty commit.
- Multiple distinct changes inside one `session start`/`session end` pair → still one commit (one session = one commit), unless the user's description makes it obvious the work is two unrelated things.
- A message that does the work but uses **neither** phrase → do the work, but don't commit; mention that it's ready and uncommitted.

**Extending this table:** more phrases will be added here over time (e.g. a hypothetical `session pause` or `session note: <text>`). Don't assume this table is exhaustive — a phrase following the `session <word>[: <description>]` shape that isn't listed yet should be treated as a request to add a row here (ask the user what behavior they want), not ignored.

## Golden rules

1. **Never hardcode colors.** Use semantic Tailwind utilities (`bg-surface`, `text-accent`, `border-border`). Colors live in `src/styles/themes.css`. This is what keeps theming working.
2. **Never fetch data in a page/component directly.** Go through `src/lib/api` (repositories). If you add a data type, add it to `src/lib/api/types.ts` first, then a repository, then consume it.
3. **Site constants live in `src/config.ts`** — name, nav, socials, themes, feature flags. Don't scatter these strings.
4. **Prefer zero-JS.** Only make something a React island (`components/react`) if it genuinely needs client interactivity. Use the laziest hydration directive that works (`client:idle` / `client:visible`), not `client:load` — `Cursor.tsx` is the one deliberate exception (must appear immediately; see its file comment) and a real bug once (a naive `requestAnimationFrame` loop that never stopped starved `requestIdleCallback`, hanging other islands' `client:idle` hydration indefinitely — Motion springs fixed this because they stop scheduling frames at rest).
5. **Respect motion prefs.** Any new animation must no-op under `prefers-reduced-motion: reduce`.
6. **Re-init on navigation.** Client scripts that touch the DOM must run inside a `document.addEventListener('astro:page-load', …)` handler, because View Transitions swap the DOM without a full reload. Guard against double-binding (`if (el.dataset.bound) return`).

## Where things go

| Task                          | Location                                             |
| ----------------------------- | ---------------------------------------------------- |
| New page/route                | `src/pages/<name>.astro` (use `<BaseLayout>`)        |
| New reusable presentational   | `src/components/ui/*.astro`                           |
| New interactive widget        | `src/components/react/*.tsx` (island)                |
| New page section              | `src/components/sections/*.astro`                    |
| New global state              | `src/lib/stores/*.store.ts` (Zustand)                |
| New data type + source        | `types.ts` → `repositories/*.repo.ts` → `data/*`     |
| New theme                     | `themes.css` block + register in `config.ts`         |
| New blog post                 | `src/content/blog/*.md` (frontmatter must match schema in `content.config.ts`) |

## Conventions

- **Path aliases** (see `tsconfig.json`): `@/…`, `@components/…`, `@layouts/…`, `@lib/…`, `@stores/…`, `@data/…`, `@styles/…`. Use them; avoid deep `../../..`.
- **Astro components** for anything static; **`.tsx`** only for islands.
- Stores are named `*.store.ts` and export a `useXStore` hook.
- Repositories are `*.repo.ts` and return **domain types**, never raw DTOs.
- Every page passes `title`/`description` to `<BaseLayout>` for SEO. Use `type="article"` + `publishedTime` on posts.
- Keep comments purposeful — explain *why*, match the existing density.

## Gotchas

- **Literal `{`/`}` in Astro markup** are parsed as JSX expressions — escape as `&#123;`/`&#125;` (see the terminal block in `about.astro`).
- The **boot loader** and **scroll-reveal** are intentionally Astro + inline scripts (not islands) so they survive View Transitions. Don't convert them to React.
- `output` is `'static'`. Middleware runs at build time until you switch to SSR (see `ARCHITECTURE.md → Going SSR`).
- The custom cursor sets `cursor: none` only for fine pointers via `html[data-cursor-active]` — a deliberately different attribute from the per-element `data-cursor="hover"|"text"` variant tag (sharing one name let `closest('[data-cursor]')` fall through to `<html>` itself and silently corrupt the read).
- Multi-column splits with real content (stat numbers, code blocks, form + sidebar) should target `lg:` (1024px), not `md:` (768px) — tablets get cramped at 768px with narrow columns. Simple layouts (nav lists, footer columns) can stay at `sm:`/`md:`.

## Definition of done

- [ ] `npm run build` passes (0 errors).
- [ ] New animations gated behind reduced-motion.
- [ ] Colors are semantic tokens, not hex.
- [ ] Data flows through `lib/api`, not inline fetches.
- [ ] Page has SEO title/description.
