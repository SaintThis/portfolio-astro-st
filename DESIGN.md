# Design System

The visual language: **cyberpunk × code editor**. Dark, boxy, neon-accented, with terminal motifs and just enough motion to feel alive without getting in the way.

## Design principles

1. **Boxy over round** — low radius (`--radius-box: 4px`). Sharp, technical, "engineered".
2. **Mono for signal, sans for body** — JetBrains Mono for labels/UI chrome/kickers; Inter for readable prose.
3. **Neon as accent, not as surface** — backgrounds stay near-black; accents (magenta/cyan) are used sparingly for emphasis and glow.
4. **Motion earns its place** — every animation is subtle, fast, and disabled under `prefers-reduced-motion`.
5. **Lightweight first** — effects are CSS where possible; JS only where CSS can't.

## Themes

Four themes, each a re-binding of the same semantic tokens (see `src/styles/themes.css`):

| Theme        | Mood                          | Accent → Accent-2         |
| ------------ | ----------------------------- | ------------------------- |
| `cyberpunk`  | Void black, hot neon (default)| Magenta `#ff2e88` → Cyan  |
| `matrix`     | Terminal green on black       | Green `#00ff66`           |
| `synthwave`  | Sunset purple + orange        | Pink `#ff6ac1` → Orange   |
| `paper`      | Light, high-contrast day mode | Magenta `#d6006e` (AA)    |

**Theme switching** is a dropdown in the header (`ThemeSwitcher.tsx`). The choice persists in `localStorage` and applies before paint (no flash). Because everything reads CSS variables, switching is instant and global.

> **Add a theme:** copy a block in `themes.css`, change the id + values, then register `{ id, label, hint }` in `config.ts → THEMES`. Done — the switcher and swatches pick it up automatically.

### Semantic tokens

Never hardcode a color. Use these (exposed as Tailwind utilities):

| Token             | Utility            | Use for                          |
| ----------------- | ------------------ | -------------------------------- |
| `--color-bg`      | `bg-bg`            | page background                  |
| `--color-surface` | `bg-surface`       | cards, panels                    |
| `--color-border`  | `border-border`    | hairlines                        |
| `--color-fg`      | `text-fg`          | primary text                     |
| `--color-fg-muted`| `text-fg-muted`    | secondary text                   |
| `--color-accent`  | `text-accent`      | primary accent / CTAs            |
| `--color-accent-2`| `text-accent-2`    | secondary accent (cyan)          |

## Typography

- **Display/body:** Inter (400–800)
- **Mono/UI:** JetBrains Mono (400–700)
- Headings: `font-weight: 700`, tight tracking (`-0.02em`), `text-wrap: balance`.
- Kickers: the `.kicker` utility — uppercase mono, wide tracking, cyan.

### Fonts

Currently loaded from Google Fonts with `display=swap` (see `BaseLayout.astro`). **For best performance & privacy, self-host:**

```bash
npm i @fontsource-variable/inter @fontsource-variable/jetbrains-mono
```

```ts
// import once, e.g. in BaseLayout frontmatter
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
```

Then remove the `<link>` tags. This drops a render-blocking third-party request.

## Signature motifs

- **Terminal window** (`TerminalWindow.astro`) — traffic-light chrome; used for the "profile.json" block and can wrap any content.
- **Grid backdrop** (`.bg-grid`) — faint masked grid behind the whole page.
- **Scanlines** (`.scanlines`) — subtle CRT overlay on feature panels.
- **Corner brackets** — accent brackets that light up on card hover.
- **Blinking caret** (`_`) — appended to the wordmark and headings for that "coding" feel.
- **Mono kickers** with `//` and index numbers (`00`, `01`) above section titles.

## Motion language

| Element        | Animation                                             | Tech                    |
| -------------- | ----------------------------------------------------- | ----------------------- |
| Intro loader   | Boot log stagger + progress bar, then wipe            | GSAP timeline           |
| Page nav       | Cover → swap → boot, via View Transitions             | Astro + loader          |
| Custom cursor  | Dot tracks 1:1; ring eases (lerp 0.18); hover scales  | rAF (no lib)            |
| Scroll reveal  | Fade + 24px rise, `once`, `power3.out`                | GSAP ScrollTrigger      |
| Hero headline  | Rotating role words                                   | GSAP                    |
| Skill bars     | Width 0 → target on scroll-in                         | GSAP ScrollTrigger      |
| Buttons/cards  | Translate + glow on hover                             | CSS transitions         |

**Easing:** default to `--ease-out-expo` / GSAP `power2–3.out`. Keep durations 200–700ms. Nothing should feel sluggish.

### The custom cursor

- Two elements: a solid **dot** (instant) and an eased **ring** (spring-like via lerp).
- Reacts to any element with `data-cursor="hover"` (scale) or `data-cursor="text"` (I-beam). Add `data-cursor-label="View"` to show a label (used on project/blog cards).
- **Disabled** on coarse (touch) pointers — the OS cursor is restored (`html[data-cursor='custom']` toggles `cursor: none`). Hydrated with `client:load` so it appears immediately.
- Under **reduced-motion** the cursor still shows, but the trailing animation is dropped: the ring's lerp factor becomes `1`, so it snaps to the pointer instead of easing (pointer tracking is user-driven, not autoplaying motion).

## Layout & spacing

- Content max-width: `max-w-6xl` (72rem), padded `px-5`.
- Sections: generous vertical rhythm (`py-16`–`py-24`).
- **Bento grid** on the home page: a responsive mosaic (`grid-cols-2 md:grid-cols-4`) mixing a big intro cell, stat cells, and status cells.

## Accessibility checklist

- Contrast: accents chosen to pass AA on their surfaces (the `paper` theme uses darker accents for light-bg contrast).
- Focus: visible cyan focus rings (`:focus-visible`).
- Motion: fully gated behind `prefers-reduced-motion`.
- Semantics: landmarks (`header`/`main`/`footer`/`nav`), `aria-current`, labeled controls.
- Never rely on color alone (status uses text + dot).

## Adding OG images

Drop a `1200×630` PNG at `public/og/default.png` (referenced by `SITE.ogImage`). For per-page images, pass `image="/og/your-page.png"` to `<BaseLayout>`. Consider generating them at build time with `@vercel/og` / `astro-og-canvas` later.
