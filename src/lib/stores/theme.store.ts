import { create } from 'zustand';
import { DEFAULT_THEME, THEMES, type ThemeId } from '@/config';

interface ThemeState {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  cycleTheme: () => void;
}

const THEME_IDS = THEMES.map((t) => t.id) as ThemeId[];

/** Cookie the server reads to pick a theme's LAYOUT (see src/middleware.ts).
 *  Themes now change server-rendered markup, not just CSS variables, so the
 *  theme has to travel with the request — localStorage can't do that. */
export const THEME_COOKIE = 'theme';

/**
 * Reflect a theme onto the cookie AND the current document.
 *
 * The cookie is authoritative: it's what middleware reads on the next request
 * to decide which hero/nav/card variants to render. The data attribute keeps
 * the current document consistent until the reload lands.
 */
function applyTheme(theme: ThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  // One year, root path, Lax. Deliberately NOT HttpOnly — the pre-paint script
  // in BaseLayout reads it to correct statically prerendered routes.
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`;
}

/**
 * Global theme store.
 *
 * Deliberately NOT persisted to localStorage. The cookie is the single source
 * of truth — a second persisted copy could disagree with it, and since the
 * theme now selects server-rendered *markup*, a disagreement would mean one
 * theme's layout wearing another theme's colors. It also means a stale id from
 * a removed theme can't be resurrected on rehydrate.
 *
 * The initial value is the plain default rather than a cookie read, because
 * islands are server-rendered too: reading the cookie here would make the
 * client's first render disagree with the server's and trip React's hydration
 * mismatch (error #418). `ThemeSwitcher` adopts the real value from
 * `<html data-theme>` in a mount effect instead, after hydration is safe.
 */
export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: DEFAULT_THEME,
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  cycleTheme: () => {
    const idx = THEME_IDS.indexOf(get().theme);
    const next = THEME_IDS[(idx + 1) % THEME_IDS.length];
    applyTheme(next);
    set({ theme: next });
  },
}));
