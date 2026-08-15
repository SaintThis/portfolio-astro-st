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

/** One year, root path, Lax. Deliberately NOT HttpOnly — the pre-paint script
 *  in BaseLayout reads it to correct statically prerendered routes. */
function setThemeCookie(theme: ThemeId) {
  if (typeof document === 'undefined') return;
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=31536000;SameSite=Lax`;
}

/**
 * Reflect a theme onto the cookie AND the current document.
 *
 * The cookie is authoritative: it's what middleware reads on the next request
 * to decide which hero/nav/card variants to render. The data attribute keeps
 * the current document consistent for callers that DON'T immediately reload
 * (there are none today — see `switchThemeWithReload` below for the one real
 * caller, which deliberately skips this).
 */
function applyTheme(theme: ThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  setThemeCookie(theme);
}

/**
 * The one real theme-change path (ThemeSwitcher's `onValueChange`): a theme
 * picks server-rendered LAYOUT, not just CSS variables, so the only honest way
 * to show it is a hard reload — there's no in-place transition to animate.
 *
 * Deliberately does NOT call `applyTheme`/mutate `<html data-theme>` first.
 * That used to happen before the reload, which repainted every CSS custom
 * property against the OLD layout's still-mounted markup for the instant
 * before the reload actually landed — the old structure wearing the new
 * theme's colors, a visible flash-then-reload. Skipping it means the page
 * stays 100% visually in the old theme (structure + colors, consistent) right
 * up until the browser actually reloads and paints the new theme's fresh HTML
 * — colors and layout change together, atomically, exactly once.
 *
 * Also re-shows the persisted boot overlay (`#boot`, `transition:persist`'d,
 * already styled for the CURRENT theme — see `IntroLoader.astro`) instantly,
 * covering the viewport for the round-trip so there's no frozen old-page frame
 * either. The reloaded document runs its own cold-boot sequence naturally
 * (module state resets on a real reload), with the NEW theme's own motif.
 */
export function switchThemeWithReload(theme: ThemeId) {
  setThemeCookie(theme);
  const boot = document.getElementById('boot');
  if (boot) {
    boot.dataset.state = 'boot';
    boot.style.display = '';
    boot.style.opacity = '1';
    boot.style.visibility = 'visible';
  }
  window.location.reload();
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
