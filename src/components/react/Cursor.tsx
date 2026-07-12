import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useCursorStore } from '@stores/index';

/**
 * Custom animated cursor, built on Motion springs.
 *
 * A small solid dot tracks the pointer 1:1 (direct DOM write — no easing
 * wanted there). A larger ring spring-follows it via `useSpring`, and
 * "snaps" magnetically to the center of any `[data-cursor='hover']` element
 * (buttons, cards, nav links) while hovering it — motion.dev's cursor docs
 * describe this as a paid `<Cursor/>` component; we get the same tactile
 * feel for free by driving the same spring toward a different target.
 *
 * Motion's springs stop scheduling frames once they're at rest, unlike a
 * naive rAF loop that runs forever — this matters because an always-on rAF
 * loop was previously found to starve `requestIdleCallback`, delaying
 * `client:idle` hydration on other islands (ThemeSwitcher, Sidebar) on
 * this exact class of browser engine.
 *
 * The nodes are ALWAYS rendered (so refs exist for the effect); behavior is
 * gated instead:
 *  - Disabled on coarse/no pointer (touch) — nodes stay at opacity 0.
 *  - Under `prefers-reduced-motion`, the spring is tuned near-instant (no
 *    perceptible trail) rather than disabling the cursor entirely, because
 *    pointer tracking is user-driven, not autoplaying motion.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const setVariant = useCursorStore((s) => s.setVariant);

  const [reduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const springConfig = reduced
    ? { stiffness: 1000, damping: 100, mass: 0.1 } // effectively instant, no trail
    : { stiffness: 300, damping: 28, mass: 0.6 }; // tactile magnetic pull
  const ringX = useSpring(targetX, springConfig);
  const ringY = useSpring(targetY, springConfig);

  useEffect(() => {
    const fine =
      window.matchMedia('(pointer: fine)').matches ||
      window.matchMedia('(any-pointer: fine)').matches;
    if (!fine) return; // touch device — leave the OS cursor alone

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    // A distinct attribute from the per-element `data-cursor="hover"|"text"`
    // variant tag below — sharing one name let `closest('[data-cursor]')`
    // fall through to <html> itself when no closer element opted in.
    document.documentElement.dataset.cursorActive = '';

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let seen = false;
    let magnetEl: HTMLElement | null = null;

    const reveal = () => {
      if (seen) return;
      seen = true;
      dot.style.opacity = ring.style.opacity = '1';
    };

    // While hovering a magnetic element, the ring targets its center instead
    // of the raw pointer position.
    const updateTarget = () => {
      if (magnetEl) {
        const r = magnetEl.getBoundingClientRect();
        targetX.set(r.left + r.width / 2);
        targetY.set(r.top + r.height / 2);
      } else {
        targetX.set(mx);
        targetY.set(my);
      }
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      updateTarget();
      reveal();
    };

    const onOver = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-cursor]');
      const interactive = (e.target as HTMLElement)?.closest<HTMLElement>(
        'a, button, [role="button"], input, textarea, select, label'
      );
      if (el) {
        const variant = (el.dataset.cursor as 'hover' | 'text') ?? 'hover';
        const text = el.dataset.cursorLabel ?? '';
        ring.dataset.variant = variant;
        label.textContent = text;
        setVariant(variant, text);
        magnetEl = variant === 'hover' ? el : null;
      } else if (interactive) {
        ring.dataset.variant = 'hover';
        label.textContent = '';
        setVariant('hover');
        magnetEl = interactive;
      }
      updateTarget();
    };
    const onOut = () => {
      ring.dataset.variant = 'default';
      label.textContent = '';
      setVariant('default');
      magnetEl = null;
      updateTarget();
    };
    const onDown = () => (ring.dataset.pressed = 'true');
    const onUp = () => (ring.dataset.pressed = 'false');
    const onLeave = () => (dot.style.opacity = ring.style.opacity = '0');
    const onEnter = () => seen && (dot.style.opacity = ring.style.opacity = '1');

    targetX.set(mx);
    targetY.set(my);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerout', onOut, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      delete document.documentElement.dataset.cursorActive;
    };
  }, [setVariant, targetX, targetY]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999]">
      <div
        ref={dotRef}
        className="absolute -ml-[3px] -mt-[3px] h-[6px] w-[6px] rounded-full bg-accent opacity-0 will-change-transform"
        style={{ transition: 'opacity .2s' }}
      />
      <motion.div
        ref={ringRef}
        data-variant="default"
        className="cursor-ring absolute -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full border border-accent-2 opacity-0 will-change-transform"
        style={{ x: ringX, y: ringY }}
      >
        <span ref={labelRef} className="font-mono text-[10px] tracking-wide text-accent-2" />
      </motion.div>

      <style>{`
        .cursor-ring { transition: width .18s var(--ease-out-expo), height .18s var(--ease-out-expo), background-color .18s, opacity .2s; }
        .cursor-ring[data-variant='hover'] { width: 3.5rem; height: 3.5rem; margin-left:-1.75rem; margin-top:-1.75rem; background: color-mix(in srgb, var(--color-accent-2) 12%, transparent); }
        .cursor-ring[data-variant='text']  { width: 2px; height: 1.4rem; border-radius: 1px; margin-left:-1px; }
        .cursor-ring[data-pressed='true']  { filter: brightness(1.4) saturate(1.4); }
      `}</style>
    </div>
  );
}
