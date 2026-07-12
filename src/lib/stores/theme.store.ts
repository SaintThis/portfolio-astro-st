import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_THEME, THEMES, type ThemeId } from '@/config';

interface ThemeState {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  cycleTheme: () => void;
}

const THEME_IDS = THEMES.map((t) => t.id) as ThemeId[];

/** Reflect the store value onto <html data-theme> + <meta theme-color>. */
function applyTheme(theme: ThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

/**
 * Global theme store, persisted to localStorage under `theme-store`.
 * A tiny inline script in BaseLayout applies the saved theme *before* paint
 * to avoid a flash — this store keeps React islands in sync after hydration.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
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
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => localStorage),
      // Re-apply on rehydrate so store + DOM never drift.
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
