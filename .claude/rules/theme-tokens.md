# Theme tokens

Linked from [`CLAUDE.md`](../../CLAUDE.md). Read this before styling anything — it exists so an agent never hardcodes a hex value or invents a token name that isn't real (golden rule #1 in `CLAUDE.md`).

**Source of truth**: [`src/styles/themes.css`](../../src/styles/themes.css) defines the raw CSS variables per theme; [`src/styles/global.css`](../../src/styles/global.css)'s `@theme inline` block maps them to the Tailwind utility names below. If a value here ever looks stale, those two files win — re-read them, don't trust this cache.

## Color tokens

Each row is one semantic token. Use the Tailwind utility column in markup (`bg-surface`, `text-accent`); use the CSS var column only inside a `<style>` block or inline `style` that needs the raw value (e.g. `color-mix(in srgb, var(--color-accent-2) 45%, transparent)`).

| Tailwind utility | CSS var | Cyberpunk (default) | Matrix | Synthwave | Paper (light) |
| --- | --- | --- | --- | --- | --- |
| `bg-bg` / `text-bg` | `--color-bg` | `#08080c` | `#020604` | `#150a24` | `#f5f4ef` |
| `bg-bg-soft` | `--color-bg-soft` | `#0e0e16` | `#04120a` | `#1d0f30` | `#eeede6` |
| `bg-surface` | `--color-surface` | `#12121c` | `#06180d` | `#241238` | `#ffffff` |
| `bg-surface-2` | `--color-surface-2` | `#191926` | `#0a2213` | `#2e1745` | `#f0efe8` |
| `border-border` | `--color-border` | `#262636` | `#123d22` | `#3d2059` | `#d9d7cc` |
| `text-fg` | `--color-fg` | `#e8e8f0` | `#c8ffd8` | `#ffe9f5` | `#16161a` |
| `text-fg-muted` | `--color-fg-muted` | `#9a9ab0` | `#5fbf7f` | `#c79ad6` | `#55555f` |
| `text-fg-faint` | `--color-fg-faint` | `#5a5a70` | `#2f6f45` | `#7d5a94` | `#8a8a94` |
| `text-accent` / `bg-accent` | `--color-accent` | `#ff2e88` (magenta) | `#00ff66` (green) | `#ff6ac1` (pink) | `#d6006e` (magenta, AA) |
| `text-accent-2` / `bg-accent-2` | `--color-accent-2` | `#00f0ff` (cyan) | `#7dff9e` | `#ffb457` (orange) | `#0068a8` (blue) |
| `text-accent-3` / `bg-accent-3` | `--color-accent-3` | `#b026ff` (violet) | `#00cc52` | `#7a5cff` (indigo) | `#6a1bd1` |
| `text-accent-contrast` | `--color-accent-contrast` | `#08080c` | `#020604` | `#150a24` | `#ffffff` |
| `text-success` | `--color-success` | `#2effa5` | `#00ff66` | `#4dffd2` | `#077d55` |
| `text-warning` | `--color-warning` | `#ffd02e` | `#d4ff00` | `#ffd166` | `#9a6a00` |
| `text-danger` | `--color-danger` | `#ff3b5c` | `#ff5252` | `#ff5d73` | `#c1121f` |

**Never write a hex value in a component.** If you need a color, one of the rows above already covers it. If it genuinely doesn't, add a new token to all four blocks in `themes.css` + the `@theme inline` map in `global.css` — don't inline a one-off hex "just this once."

## Non-color tokens

| Token | Value | Notes |
| --- | --- | --- |
| `--glow` | `0 0 24px` (cyberpunk) / `0 0 22px` (matrix) / `0 0 26px` (synthwave) / `0 0 0` (paper) | Paper is intentionally glow-free (light/day mode) — anything built on `--glow` degrades gracefully instead of needing a separate light-mode branch. |
| `--grid-line` | theme-tinted low-alpha rgba | Backs `.bg-grid`. |
| `--radius-box` | `4px` | The *only* border-radius in the design language — "boxy, low-radius by design" (see `CLAUDE.md` gotchas). Don't reach for `rounded-full`/`rounded-lg` on new UI unless deliberately breaking the pattern (e.g. status dots, avatar-style circles). |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Standard easing for hover/reveal transitions. |
| `--font-sans` | Inter | Body text. |
| `--font-mono` | JetBrains Mono | Labels, kickers, code, nav, anything "terminal." |

## Ready-made utility classes (don't reinvent these)

| Class | What it does |
| --- | --- |
| `.text-glow` | `text-shadow` using `--glow` + current `--color-accent`. |
| `.box-glow` | `box-shadow` using `--glow` + current `--color-accent`. Used by `Button`, `ProjectCard`, `ContactForm`'s submit button, and the cursor's hover glow. |
| `.text-gradient` | Accent-to-accent-3 gradient text clip. |
| `.bg-grid` | Full-bleed cyberpunk grid backdrop (masked radial fade). |
| `.scanlines::before` | Subtle animated scanline overlay — apply to a `position: relative` container. |
| `.kicker` | Mono, uppercase, letter-spaced label used above section headings (see `SectionHeading.astro`). |

If a new component needs a glow/gradient/grid effect, reach for one of these six first — check `global.css` before writing a new one.
