import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { useCursorStore } from '@stores/index';

/** Breathing room (px) added around a hovered element's own box before the
 *  cursor's shape matches it — a ring that clipped exactly to the element's
 *  edges read as a selection outline, not a cursor. */
const SHAPE_PADDING = 10;

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
 * The ring's *shape* is decoupled from its *position*: a `shapeRef` div
 * nested inside the spring-positioned wrapper morphs its width/height/
 * border-radius (via a plain CSS transition, not a spring — there's no
 * "velocity" to a size change) to match whatever it's hovering, read
 * straight off `getBoundingClientRect`/`getComputedStyle`. A button gets a
 * pill that hugs its own rounding; a square card gets a square ring. It
 * also picks up the current theme's accent glow (`--glow` + `--color-
 * accent-2`, the same tokens `.box-glow` uses) so the highlight always
 * matches whichever theme is active, never a hardcoded color.
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
  const shapeRef = useRef<HTMLDivElement>(null);
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
    const shape = shapeRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !shape || !label) return;

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

    // Morph the ring to the hovered element's own footprint — same aspect
    // ratio and corner rounding, plus a fixed padding so it reads as a
    // highlight rather than a pixel-perfect mask. Falls back to the design
    // system's base radius for elements with no explicit rounding (e.g. a
    // plain text link) so the shape still looks intentional.
    const applyShape = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const radius = getComputedStyle(el).borderRadius;
      shape.style.width = `${r.width + SHAPE_PADDING * 2}px`;
      shape.style.height = `${r.height + SHAPE_PADDING * 2}px`;
      shape.style.borderRadius = radius === '0px' ? 'var(--radius-box)' : radius;
    };
    const applyTextShape = () => {
      shape.style.width = '2px';
      shape.style.height = '1.4rem';
      shape.style.borderRadius = '1px';
    };
    const clearShape = () => {
      shape.style.width = '';
      shape.style.height = '';
      shape.style.borderRadius = '';
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
      const target = el ?? interactive;
      const variant = el ? ((el.dataset.cursor as 'hover' | 'text') ?? 'hover') : 'hover';
      const text = el?.dataset.cursorLabel ?? '';

      if (target) {
        shape.dataset.variant = variant;
        label.textContent = text;
        setVariant(variant, text);
        magnetEl = variant === 'hover' ? target : null;
        if (variant === 'hover') applyShape(target);
        else applyTextShape();
      }
      updateTarget();
    };
    const onOut = () => {
      shape.dataset.variant = 'default';
      label.textContent = '';
      setVariant('default');
      magnetEl = null;
      clearShape();
      updateTarget();
    };
    const onDown = () => (shape.dataset.pressed = 'true');
    const onUp = () => (shape.dataset.pressed = 'false');
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
      {/* Position wrapper: spring-follows the pointer/magnet target, zero
          footprint of its own so the shape below can center on it via
          `translate(-50%,-50%)` regardless of its current size. */}
      <motion.div
        ref={ringRef}
        className="absolute left-0 top-0 h-0 w-0 opacity-0"
        style={{ x: ringX, y: ringY }}
      >
        <div
          ref={shapeRef}
          data-variant="default"
          className="cursor-ring absolute flex items-center justify-center border border-accent-2 will-change-[width,height,border-radius,box-shadow]"
        >
          <span ref={labelRef} className="font-mono text-[10px] tracking-wide text-accent-2" />
        </div>
      </motion.div>

      <style>{`
        .cursor-ring {
          top: 0;
          left: 0;
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          transform: translate(-50%, -50%);
          transition:
            width .18s var(--ease-out-expo),
            height .18s var(--ease-out-expo),
            border-radius .18s var(--ease-out-expo),
            box-shadow .2s ease,
            background-color .2s ease;
        }
        /* Accent-glow highlight, sized/shaped in JS to match whatever's hovered
           (see applyShape in Cursor.tsx) — same --glow token as .box-glow, so
           it always matches the active theme instead of a hardcoded color. */
        .cursor-ring[data-variant='hover'] {
          background: color-mix(in srgb, var(--color-accent-2) 12%, transparent);
          border-color: var(--color-accent-2);
          box-shadow: var(--glow) color-mix(in srgb, var(--color-accent-2) 45%, transparent);
        }
        .cursor-ring[data-pressed='true'] { filter: brightness(1.4) saturate(1.4); }
      `}</style>
    </div>
  );
}
