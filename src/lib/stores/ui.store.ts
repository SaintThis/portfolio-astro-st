import { create } from 'zustand';

interface UIState {
  mobileNavOpen: boolean;
  /** True while the intro/boot loader is covering the screen. */
  booting: boolean;
  setMobileNav: (open: boolean) => void;
  toggleMobileNav: () => void;
  setBooting: (booting: boolean) => void;
}

/** Ephemeral UI state (not persisted). */
export const useUIStore = create<UIState>((set) => ({
  mobileNavOpen: false,
  booting: true,
  setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  setBooting: (booting) => set({ booting }),
}));
