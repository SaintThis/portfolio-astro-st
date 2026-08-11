import { useEffect, useState } from 'react';
import { Select } from '@base-ui/react/select';
import { useThemeStore } from '@stores/index';
import { THEMES, type ThemeId } from '@/config';

/**
 * Theme picker island, built on Base UI's Select primitive.
 *
 * Base UI handles the a11y-hard parts for free: keyboard navigation
 * (arrows/Home/End/typeahead), focus management, `aria-*` wiring, and
 * outside-click/Escape dismissal — replacing a hand-rolled listbox that had
 * none of that. We only own the visuals (semantic Tailwind tokens) and the
 * Zustand wiring.
 *
 * The active theme is already applied to <html> pre-paint by the no-flash
 * script (see BaseLayout); this component just syncs the store to that value
 * on mount, then drives changes.
 */
interface Props {
  /** The theme the SERVER rendered this page with (`Astro.locals.theme`).
   *  Passed in rather than read from a cookie on mount: islands are
   *  server-rendered too, so deriving it client-side made the first client
   *  render disagree with the server's (React hydration error #418) and left
   *  the trigger showing a stale label. */
  initialTheme: ThemeId;
  /** Which edge the menu opens from. The vertical rail nav (Matrix) passes
   *  `right` so the menu sits beside the rail instead of on top of its own
   *  links — the trigger there is pinned to the bottom of a full-height
   *  column, where a downward menu has nowhere to go. */
  side?: 'bottom' | 'right';
}

export default function ThemeSwitcher({ initialTheme, side = 'bottom' }: Props) {
  const setTheme = useThemeStore((s) => s.setTheme);
  // Local, seeded from the server value, so SSR and hydration agree exactly.
  const [theme, setLocalTheme] = useState<ThemeId>(initialTheme);

  // Portal into a container that lives inside the `transition:persist`'d
  // header (see Header.astro) instead of Base UI's default (document.body,
  // appended dynamically — invisible to Astro's View Transitions and
  // destroyed on the first client-side navigation). Resolved once: this
  // component's instance never remounts across navigations, so the captured
  // reference stays valid.
  const [portalContainer] = useState(() =>
    typeof document !== 'undefined' ? document.getElementById('base-ui-portal-root') : null
  );

  // Keep the (non-persisted) store in step with the server's value once, after
  // hydration — other islands read it, and it must not diverge from the cookie.
  useEffect(() => {
    setTheme(initialTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = THEMES.map((t) => ({ label: t.label, value: t.id }));

  return (
    <Select.Root
      items={items}
      value={theme}
      onValueChange={(value) => {
        const next = value as ThemeId;
        if (next === theme) return;
        // Write the cookie + data-theme first…
        setLocalTheme(next);
        setTheme(next);
        // …then re-render the whole document. A theme now decides the
        // server-rendered LAYOUT (hero/nav/card variants), not just CSS
        // variables, so swapping tokens in place would leave the old
        // structure behind. A hard reload is the honest way to get the new
        // markup — and it bypasses the View Transitions router, which would
        // otherwise reuse the persisted header.
        window.location.reload();
      }}
    >
      <Select.Trigger
        aria-label="Change theme"
        data-cursor="hover"
        className="group flex items-center gap-2 rounded-[var(--radius-box)] border border-border bg-surface px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg data-[popup-open]:border-accent data-[popup-open]:text-fg"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-accent box-glow" />
        <Select.Value className="hidden sm:inline">
          {(value: ThemeId) => THEMES.find((t) => t.id === value)?.label ?? value}
        </Select.Value>
        <Select.Icon className="opacity-60 transition-transform data-[popup-open]:rotate-180">
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.4" fill="none" />
          </svg>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal container={portalContainer}>
        <Select.Positioner side={side} sideOffset={8} align="end" className="z-20 outline-none">
          <Select.Popup className="theme-popup w-52 overflow-hidden rounded-[var(--radius-box)] border border-border bg-surface-2 p-1 shadow-2xl outline-none">
            <Select.List>
              {THEMES.map((t) => (
                <Select.Item
                  key={t.id}
                  value={t.id}
                  data-cursor="hover"
                  className="flex w-full cursor-pointer items-start gap-2 rounded-[3px] px-2.5 py-2 outline-none transition-colors data-[highlighted]:bg-surface data-[selected]:text-accent"
                >
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    data-theme={t.id}
                    style={{ background: 'var(--color-accent)' }}
                  />
                  <span className="min-w-0">
                    <Select.ItemText className="block text-sm font-medium text-fg">
                      {t.label}
                    </Select.ItemText>
                    <span className="block truncate font-mono text-[10px] text-fg-faint">
                      {t.hint}
                    </span>
                  </span>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
