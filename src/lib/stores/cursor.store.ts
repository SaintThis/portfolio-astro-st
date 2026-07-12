import { create } from 'zustand';

export type CursorVariant = 'default' | 'hover' | 'text' | 'hidden';

interface CursorState {
  variant: CursorVariant;
  /** Optional label shown next to the cursor (e.g. "View", "Open"). */
  label: string;
  setVariant: (variant: CursorVariant, label?: string) => void;
  reset: () => void;
}

/**
 * Drives the custom cursor island. Any component can call `setVariant('hover')`
 * on mouse enter to make the cursor react — but the simplest integration is the
 * declarative `data-cursor` attribute handled inside the Cursor island itself.
 */
export const useCursorStore = create<CursorState>((set) => ({
  variant: 'default',
  label: '',
  setVariant: (variant, label = '') => set({ variant, label }),
  reset: () => set({ variant: 'default', label: '' }),
}));
