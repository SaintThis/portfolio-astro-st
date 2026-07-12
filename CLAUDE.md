# CLAUDE.md

Guidance for Claude (and other AI agents) working in this repo. Keep changes consistent with what's already here.

## What this is

A cyberpunk/coder-themed **Astro 5** portfolio. Static-first, islands for interactivity, multi-theme, SEO-complete, and structured so a real API can replace example data with minimal changes. Read `ARCHITECTURE.md` and `DESIGN.md` before non-trivial work.

## Commands

```bash
npm run dev        # dev server @ 4321
npm run build      # astro check + build — MUST pass before you call a task done
npm run check      # types/diagnostics only (faster than build)
npm run format     # prettier
```

Always run `npm run build` (or at least `npm run check`) after edits. The build type-checks Astro + TS and will catch most mistakes.

## Golden rules

1. **Never hardcode colors.** Use semantic Tailwind utilities (`bg-surface`, `text-accent`, `border-border`). Colors live in `src/styles/themes.css`. This is what keeps theming working.
2. **Never fetch data in a page/component directly.** Go through `src/lib/api` (repositories). If you add a data type, add it to `src/lib/api/types.ts` first, then a repository, then consume it.
3. **Site constants live in `src/config.ts`** — name, nav, socials, themes, feature flags. Don't scatter these strings.
4. **Prefer zero-JS.** Only make something a React island (`components/react`) if it genuinely needs client interactivity. Use the laziest hydration directive that works (`client:idle` / `client:visible`), not `client:load`.
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
- The custom cursor sets `cursor: none` only for fine pointers via `html[data-cursor='custom']`.

## Definition of done

- [ ] `npm run build` passes (0 errors).
- [ ] New animations gated behind reduced-motion.
- [ ] Colors are semantic tokens, not hex.
- [ ] Data flows through `lib/api`, not inline fetches.
- [ ] Page has SEO title/description.
