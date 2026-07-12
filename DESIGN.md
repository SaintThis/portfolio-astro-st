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

**Theme switching** is a dropdown in the header (`ThemeSwitcher.tsx`), built on Base UI's `Select` for full keyboard navigation and correct ARIA — not a hand-rolled listbox. The choice persists in `localStorage` and applies before paint (no flash). Because everything reads CSS variables, switching is instant and global.

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

| Element        | Animation                                                     | Tech                       |
| -------------- | --------------------------------------------------------------- | --------------------------- |
| Intro loader   | Boot log stagger + progress % + decrypt-in brand name, then wipe | GSAP timeline + `scrambleText` |
| Page nav       | Cover → swap → boot, via View Transitions                     | Astro + loader              |
| Custom cursor  | Dot tracks 1:1; ring spring-follows and **magnetically snaps** to the center of hovered buttons/cards/links | Motion (`useMotionValue` + `useSpring`) |
| Sidebar nav    | Slide-in-from-left drawer, tablet + mobile (`< lg:`)           | Base UI `Dialog` (a11y) + Motion (`motion.div` slide) |
| Scroll reveal  | Fade + 24px rise, `once`, `power3.out`                         | GSAP ScrollTrigger          |
| Hero headline  | Rotating role words, hacker-style scramble/decrypt reveal      | GSAP + `scrambleText`       |
| Skill bars     | Width 0 → target on scroll-in                                  | GSAP ScrollTrigger          |
| Buttons/cards  | Translate + glow on hover                                      | CSS transitions             |

**Easing:** default to `--ease-out-expo` / GSAP `power2–3.out`. Keep durations 200–700ms. Nothing should feel sluggish.

### The custom cursor

- Two elements: a solid **dot** (direct DOM write, 1:1 tracking, zero lag) and an eased **ring** (`useMotionValue` + `useSpring` from `motion/react`).
- **Magnetic hover:** while hovering any `[data-cursor="hover"]` element (buttons, project cards, nav links), the ring's spring target becomes that element's bounding-box center instead of the raw pointer position — it visibly "snaps" and holds there until you move away. Add `data-cursor-label="View"` to also show a label. `data-cursor="text"` collapses the ring into a thin caret (no magnetic pull) for text inputs.
- Motion springs stop scheduling frames once at rest — unlike a naive `requestAnimationFrame` loop, this doesn't starve `requestIdleCallback`, which matters because other islands (`ThemeSwitcher`, `Sidebar`) hydrate with `client:idle` and were previously measured to hang indefinitely behind a never-idle rAF loop.
- **Disabled** on coarse (touch) pointers — the OS cursor is restored (`html[data-cursor-active]` toggles `cursor: none`; deliberately a *different* attribute than the per-element `data-cursor="hover"/"text"` variant tag, since sharing one name let `closest('[data-cursor]')` fall through to `<html>` itself). Hydrated with `client:load` so it appears immediately.
- Under **reduced-motion** the cursor still shows, but the spring is tuned near-instant (`stiffness: 1000, damping: 100`) instead of disabled — pointer tracking is user-driven, not autoplaying motion.

### Sidebar nav (tablet + mobile)

- Shown below `lg:` (1024px) — desktop keeps the persistent top nav in `Header.astro`; tablets (both orientations) and phones get the drawer, not a cramped horizontal nav.
- **Base UI `Dialog`** owns the accessibility: focus trap, `Escape` to close, backdrop click-to-close, `aria-modal`, background inert, and body scroll-lock — all built in, none hand-rolled.
- **Motion** owns the pixels: the panel is a `motion.div` composed onto `Dialog.Popup` via Base UI's `render` prop (`<Dialog.Popup render={<motion.div animate={{x: open ? 0 : '-100%'}} .../>}>`), driven by the *same* `open` boolean that controls `Dialog.Root` — no fighting Base UI's own mount/unmount timing. `Portal keepMounted` keeps the DOM around so there's something to animate on close.
- Active-link highlighting reads `window.location.pathname` directly (resynced on `astro:page-load`), not a prop — the parent `Header` is `transition:persist`'d, so nested islands never receive fresh props on client-side navigation.

### Decrypt / scramble text

- `src/lib/utils/scramble.ts` exports `scrambleText(el, finalText, opts)` — a hacker/terminal-style reveal where characters cycle through random glyphs and settle left-to-right into the final text. Pure GSAP, framework-agnostic (works from any inline `<script>`, no React needed).
- Used for the hero headline's rotating role words and the boot loader's brand-name reveal. Callers check `prefers-reduced-motion` themselves (same pattern as the rest of the motion system) — the function always animates when called.

## Layout & spacing

- Content max-width: `max-w-6xl` (72rem), padded `px-5`.
- Sections: generous vertical rhythm (`py-16`–`py-24`).
- **Bento grid** on the home page: a responsive mosaic (`grid-cols-2 lg:grid-cols-4`) mixing a big intro cell, stat cells, and status cells. The 4-col jump is deliberately at `lg:` (1024px) rather than `md:` (768px) — at tablet width, 4 narrow columns cramped the stat numbers; 2-col stays comfortable through the full tablet range.
- **Breakpoint convention:** multi-column splits that hold real content (stat numbers, code blocks, form + sidebar) target `lg:` (1024px), not `md:` (768px) — tablets get the single-column layout, only true desktop widths get the split. Simpler layouts (nav link lists, footer columns) can still use `sm:`/`md:` where narrower columns are harmless.

## Accessibility checklist

- Contrast: accents chosen to pass AA on their surfaces (the `paper` theme uses darker accents for light-bg contrast).
- Focus: visible cyan focus rings (`:focus-visible`).
- Motion: fully gated behind `prefers-reduced-motion`.
- Semantics: landmarks (`header`/`main`/`footer`/`nav`), `aria-current`, labeled controls.
- Never rely on color alone (status uses text + dot).

## Adding OG images

Drop a `1200×630` PNG at `public/og/default.png` (referenced by `SITE.ogImage`). For per-page images, pass `image="/og/your-page.png"` to `<BaseLayout>`. Consider generating them at build time with `@vercel/og` / `astro-og-canvas` later.
