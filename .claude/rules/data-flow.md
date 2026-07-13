# Data flow

Linked from [`CLAUDE.md`](../../CLAUDE.md). Read this before adding or changing anything that fetches or shapes data — it exists so an agent never invents a repository function, a fetch pattern, or a type field that isn't actually there (golden rule #2 in `CLAUDE.md`).

## The real chain, today

```
src/data/*.ts (local fixtures)
        │
        ▼
src/lib/api/repositories/*.repo.ts   ← the ONLY place that knows the data source
        │            (branches on API_ENABLED; local fixtures today, real
        │             fetch calls later — components never change)
        ▼
src/lib/api/index.ts                 ← the ONLY import path components should use
        │
        ▼
pages / components
```

Blog posts are the one exception: they go through Astro's Content Collections (`astro:content` / `getCollection('blog')`), not this repository layer, because they're Markdown files, not fixture data. See `src/content.config.ts` for that schema.

## Every type that actually exists

All defined in [`src/lib/api/types.ts`](../../src/lib/api/types.ts) — don't add a field to a component's expectations that isn't listed here:

| Type | Fields |
| --- | --- |
| `Project` | `slug, title, summary, description, tags: string[], category: 'web'\|'backend'\|'tooling'\|'mobile'\|'experiment', date, featured: boolean, status: 'live'\|'wip'\|'archived', links: { live?, repo?, caseStudy? }, cover?, metrics?: { label, value }[]` |
| `PostMeta` | `slug, title, description, date, updated?, tags: string[], draft: boolean, readingTime: number, cover?` — note: actual blog posts are read via `getCollection('blog')`, not this type; this type exists for when posts need to be summarized outside the content collection. |
| `Skill` | `name, level: number (0–100), category: 'frontend'\|'backend'\|'architecture'\|'devops'` |
| `ExperienceItem` | `role, company, period, location?, highlights: string[], current: boolean` |
| `Paginated<T>` | `items: T[], total, page, pageSize` |

## Every repository function that actually exists

All exported from [`src/lib/api/index.ts`](../../src/lib/api/index.ts) — **import from here, never from a `*.repo.ts` file directly**:

| Function | Returns | Source file |
| --- | --- | --- |
| `getProjects()` | `Promise<Project[]>` (sorted newest-first when local) | `repositories/projects.repo.ts` |
| `getFeaturedProjects(limit = 3)` | `Promise<Project[]>` (filtered `featured`) | `repositories/projects.repo.ts` |
| `getProject(slug)` | `Promise<Project \| undefined>` | `repositories/projects.repo.ts` |
| `getProjectCategories()` | `Promise<string[]>` (deduped from real data) | `repositories/projects.repo.ts` |
| `getSkills()` | `Promise<Skill[]>` | `repositories/meta.repo.ts` |
| `getExperience()` | `Promise<ExperienceItem[]>` | `repositories/meta.repo.ts` |

There is no `getPosts`, `getPost`, `getSkill`, or `getExperienceItem` — don't assume one exists by symmetry. Blog listing/detail pages call `getCollection('blog')` / `render(post)` from `astro:content` directly (see `src/pages/blog/index.astro` and `src/pages/blog/[...slug].astro`).

## Local fixtures (what backs everything today)

| File | Backs |
| --- | --- |
| `src/data/projects.ts` | `PROJECTS` — array of `Project` |
| `src/data/skills.ts` | `SKILLS` — array of `Skill` |
| `src/data/experience.ts` | `EXPERIENCE` — array of `ExperienceItem` |

## Switching a repository to a real backend

Set `PUBLIC_API_BASE_URL` (see `src/env.d.ts`) — this flips `API_ENABLED` to `true` in [`src/lib/api/http.ts`](../../src/lib/api/http.ts), and each repository's `if (API_ENABLED)` branch takes over via `apiGet<T>(path)`. The `http.ts` client is deliberately tiny (no cache/retry) — see its own comment for when to graduate to a real query library, and `src/content/blog/data-fetching-tanstack-query-vs-traditional.md` for the fuller argument.

## Global client state (not data-fetching, but adjacent)

| Store | File | Holds |
| --- | --- | --- |
| `useThemeStore` | `theme.store.ts` | `theme: ThemeId`, `setTheme`, `cycleTheme` — persisted to `localStorage` under `theme-store`; also syncs `<html data-theme>` + `<meta theme-color>` directly (not just React state). |
| `useCursorStore` | `cursor.store.ts` | `variant: 'default'\|'hover'\|'text'\|'hidden'`, `label: string`, `setVariant`, `reset` — not persisted. |
| `useUIStore` | `ui.store.ts` | `mobileNavOpen: boolean`, `booting: boolean` (true while the intro loader covers the screen), plus their setters — not persisted. Note the capitalization: `useUIStore`, not `useUiStore`. |

Import from `src/lib/stores/index.ts` (all three files live in `src/lib/stores/`), same "one barrel import" pattern as the API layer.
