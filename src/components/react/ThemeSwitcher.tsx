import { useEffect, useState } from 'react';
import { useThemeStore } from '@stores/index';
import { THEMES, type ThemeId } from '@/config';

/**
 * Theme picker island. The active theme is already applied to <html> pre-paint
 * by the no-flash script (see BaseLayout); this component just syncs the store
 * to that value on mount, then drives changes.
 */
export default function ThemeSwitcher() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const [open, setOpen] = useState(false);

  // Adopt whatever the no-flash script set on <html> so store === DOM.
  useEffect(() => {
    const current = document.documentElement.dataset.theme as ThemeId | undefined;
    if (current && current !== theme) setTheme(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${active.label}. Change theme`}
        data-cursor="hover"
        className="group flex items-center gap-2 rounded-[var(--radius-box)] border border-border bg-surface px-3 py-1.5 font-mono text-xs text-fg-muted transition-colors hover:border-accent hover:text-fg"
      >
        <span className="h-2.5 w-2.5 rounded-full bg-accent box-glow" />
        <span className="hidden sm:inline">{active.label}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" className="opacity-60">
          <path d="M1 3l4 4 4-4" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <ul
            role="listbox"
            className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-[var(--radius-box)] border border-border bg-surface-2 p-1 shadow-2xl"
          >
            {THEMES.map((t) => (
              <li key={t.id} role="option" aria-selected={t.id === theme}>
                <button
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  data-cursor="hover"
                  className={`flex w-full items-start gap-2 rounded-[3px] px-2.5 py-2 text-left transition-colors hover:bg-surface ${
                    t.id === theme ? 'text-accent' : 'text-fg'
                  }`}
                >
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    data-theme={t.id}
                    style={{ background: 'var(--color-accent)' }}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{t.label}</span>
                    <span className="block truncate font-mono text-[10px] text-fg-faint">
                      {t.hint}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
