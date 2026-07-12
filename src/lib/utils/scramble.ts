import { gsap } from 'gsap';

/** Glyphs cycled through before a character settles — mono-friendly, hacker-ish. */
const DEFAULT_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*<>/\\|_-+=';

export interface ScrambleOptions {
  /** Seconds for the full reveal. @default 0.8 */
  duration?: number;
  /** Characters to cycle through before settling. @default DEFAULT_CHARSET */
  charset?: string;
  /** GSAP ease string. @default 'none' (linear reveal reads best for this effect) */
  ease?: string;
  onComplete?: () => void;
}

/**
 * Hacker/decrypt-style text reveal: characters cycle through random glyphs and
 * settle left-to-right into `finalText`. Pure GSAP (already a dependency),
 * framework-agnostic — usable from any inline <script>, no React required.
 *
 * Callers are responsible for the `prefers-reduced-motion` check (same pattern
 * as Hero.astro's word rotator and IntroLoader's boot timeline) — this function
 * always animates.
 */
export function scrambleText(
  el: HTMLElement,
  finalText: string,
  opts: ScrambleOptions = {}
): gsap.core.Tween {
  const { duration = 0.8, charset = DEFAULT_CHARSET, ease = 'none', onComplete } = opts;
  const length = finalText.length;

  const state = { progress: 0 };
  return gsap.to(state, {
    progress: 1,
    duration,
    ease,
    onUpdate: () => {
      const revealed = Math.floor(state.progress * length);
      let out = '';
      for (let i = 0; i < length; i++) {
        if (i < revealed) {
          out += finalText[i];
        } else if (finalText[i] === ' ') {
          out += ' ';
        } else {
          out += charset[(Math.random() * charset.length) | 0];
        }
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = finalText;
      onComplete?.();
    },
  });
}
