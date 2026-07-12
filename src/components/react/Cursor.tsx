import { useEffect, useRef } from 'react';
import { useCursorStore } from '@stores/index';

/**
 * Custom animated cursor.
 *
 * A small solid dot tracks the pointer 1:1, plus a larger ring that eases behind
 * it (spring-like lerp via rAF — no animation lib, stays 60fps). The ring scales
 * up + labels itself over elements marked `data-cursor="hover"` /
 * `data-cursor-label="View"`.
 *
 * The nodes are ALWAYS rendered (so the refs exist for the effect); behavior is
 * gated instead:
 *  - Disabled on coarse/no pointer (touch) — nodes stay at opacity 0.
 *  - Under `prefers-reduced-motion`, the trailing animation is removed (ring
 *    snaps to the pointer) but the custom cursor still shows, because pointer
 *    tracking is user-driven, not autoplaying motion.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const setVariant = useCursorStore((s) => s.setVariant);

  useEffect(() => {
    const fine =
      window.matchMedia('(pointer: fine)').matches ||
      window.matchMedia('(any-pointer: fine)').matches;
    if (!fine) return; // touch device — leave the OS cursor alone

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const EASE = reduced ? 1 : 0.18; // 1 = snap (no trail), <1 = eased trail

    document.documentElement.dataset.cursor = 'custom';

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = 0;
    let seen = false;

    const reveal = () => {
      if (seen) return;
      seen = true;
      rx = mx;
      ry = my;
      dot.style.opacity = ring.style.opacity = '1';
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      reveal();
    };

    const render = () => {
      rx += (mx - rx) * EASE;
      ry += (my - ry) * EASE;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      raf = requestAnimationFrame(render);
    };

    const onOver = (e: Event) => {
      const el = (e.target as HTMLElement)?.closest<HTMLElement>('[data-cursor]');
      const interactive = (e.target as HTMLElement)?.closest(
        'a, button, [role="button"], input, textarea, select, label'
      );
      if (el) {
        const variant = (el.dataset.cursor as 'hover' | 'text') ?? 'hover';
        const text = el.dataset.cursorLabel ?? '';
        ring.dataset.variant = variant;
        label.textContent = text;
        setVariant(variant, text);
      } else if (interactive) {
        ring.dataset.variant = 'hover';
        label.textContent = '';
        setVariant('hover');
      }
    };
    const onOut = () => {
      ring.dataset.variant = 'default';
      label.textContent = '';
      setVariant('default');
    };
    const onDown = () => (ring.dataset.pressed = 'true');
    const onUp = () => (ring.dataset.pressed = 'false');
    const onLeave = () => (dot.style.opacity = ring.style.opacity = '0');
    const onEnter = () => seen && (dot.style.opacity = ring.style.opacity = '1');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    document.addEventListener('pointerout', onOut, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      delete document.documentElement.dataset.cursor;
    };
  }, [setVariant]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[9999]">
      <div
        ref={dotRef}
        className="absolute -ml-[3px] -mt-[3px] h-[6px] w-[6px] rounded-full bg-accent opacity-0 will-change-transform"
        style={{ transition: 'opacity .2s' }}
      />
      <div
        ref={ringRef}
        data-variant="default"
        className="cursor-ring absolute -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full border border-accent-2 opacity-0 will-change-transform"
      >
        <span ref={labelRef} className="font-mono text-[10px] tracking-wide text-accent-2" />
      </div>

      <style>{`
        .cursor-ring { transition: width .18s var(--ease-out-expo), height .18s var(--ease-out-expo), background-color .18s, opacity .2s; }
        .cursor-ring[data-variant='hover'] { width: 3.5rem; height: 3.5rem; margin-left:-1.75rem; margin-top:-1.75rem; background: color-mix(in srgb, var(--color-accent-2) 12%, transparent); }
        .cursor-ring[data-variant='text']  { width: 2px; height: 1.4rem; border-radius: 1px; margin-left:-1px; }
        .cursor-ring[data-pressed='true']  { filter: brightness(1.4) saturate(1.4); }
      `}</style>
    </div>
  );
}
