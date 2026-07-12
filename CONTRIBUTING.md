# Contributing

Thanks for working on this project. This guide keeps the codebase consistent and easy to extend.

## Setup

```bash
node -v            # need >= 20.11
npm install
npm run dev
```

## Workflow

1. Branch from `main`: `git checkout -b feat/<short-name>`.
2. Make focused changes (one concern per PR).
3. Run before pushing:
   ```bash
   npm run format
   npm run build     # type-check + build must pass
   ```
4. Open a PR with a clear description and screenshots for visual changes.

## Coding standards

- **TypeScript strict** — no `any` unless justified with a comment.
- **SOLID + Clean Code** — small modules, single responsibility, meaningful names. See `ARCHITECTURE.md#guiding-principles`.
- **No hardcoded colors** — use semantic tokens (`bg-surface`, `text-accent`). Add/adjust colors in `src/styles/themes.css`.
- **Data through the repository layer** — never `fetch` in a component; go through `src/lib/api`.
- **Accessibility is not optional** — semantic HTML, labels, focus states, and reduced-motion support for any animation.
- **Prefer Astro components**; only use React islands for genuine interactivity, with the laziest viable hydration directive.

## Commit messages

Conventional Commits:

```
feat(projects): add filter-by-tag to the project grid
fix(cursor): restore OS cursor on touch devices
docs(readme): document the API migration steps
chore(deps): bump astro to 5.x
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

## Adding things — quick recipes

**A page:** create `src/pages/<name>.astro`, wrap in `<BaseLayout title=… description=…>`, add it to `NAV_LINKS` in `config.ts` if it's top-level.

**A project:** add an entry to `src/data/projects.ts` (typed as `Project`). It appears in the grid and gets a static case-study page automatically.

**A blog post:** add `src/content/blog/<slug>.md` with frontmatter matching the schema in `content.config.ts`. Set `draft: true` to hide from production.

**A theme:** add a `[data-theme='id']` block to `themes.css`, then register it in `config.ts → THEMES`.

## PR checklist

- [ ] `npm run build` passes.
- [ ] `npm run format` applied.
- [ ] No hardcoded colors; semantic tokens used.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] New data goes through `lib/api`.
- [ ] Screenshots included for UI changes.
