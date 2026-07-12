import { useEffect, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { motion } from 'motion/react';
import { NAV_LINKS } from '@/config';
import { cn } from '@lib/utils';

/**
 * Collapsible sidebar nav — hamburger trigger + slide-in-from-left drawer,
 * shown below `lg:` (tablet + mobile; desktop keeps the persistent top nav
 * in Header.astro).
 *
 * Base UI's Dialog owns the accessibility-hard parts for free: focus trap,
 * Escape-to-close, backdrop click-to-close, `aria-modal`/inert background —
 * replacing what was previously a hand-rolled full-screen overlay with none
 * of that. Motion owns the pixels: the panel is a `motion.div` composed onto
 * `Dialog.Popup` via Base UI's `render` prop, animated by the SAME `open`
 * boolean that controls `Dialog.Root` — no fighting Base UI's own
 * mount/unmount timing, `Portal keepMounted` just keeps the DOM around so
 * the exit animation has something to animate.
 */
export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const [pathname, setPathname] = useState('/');

  // Portal into a container that lives inside the `transition:persist`'d
  // header (see Header.astro) instead of Base UI's default (document.body,
  // appended dynamically — invisible to Astro's View Transitions and
  // destroyed on the first client-side navigation). Resolved once: this
  // component's instance never remounts across navigations, so the captured
  // reference stays valid.
  const [portalContainer] = useState(() =>
    typeof document !== 'undefined' ? document.getElementById('base-ui-portal-root') : null
  );

  // Body scroll-lock is handled by Base UI's Dialog itself (default `modal:
  // true`) — a second manual lock here raced with it and left scroll stuck
  // locked after close.

  // The parent Header persists across View Transitions, so nested islands
  // never get fresh props on subsequent navigations — read location directly
  // and resync on every page-load, same pattern as Header's own nav script.
  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    sync();
    document.addEventListener('astro:page-load', sync);
    return () => document.removeEventListener('astro:page-load', sync);
  }, []);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <div className="lg:hidden">
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger
          aria-label={open ? 'Close menu' : 'Open menu'}
          render={
            <button
              type="button"
              className="relative z-50 flex h-9 w-9 flex-col items-center justify-center gap-1.5"
            >
              <span
                className={cn(
                  'h-0.5 w-6 bg-fg transition-transform duration-300',
                  open && 'translate-y-2 rotate-45'
                )}
              />
              <span className={cn('h-0.5 w-6 bg-fg transition-opacity', open && 'opacity-0')} />
              <span
                className={cn(
                  'h-0.5 w-6 bg-fg transition-transform duration-300',
                  open && '-translate-y-2 -rotate-45'
                )}
              />
            </button>
          }
        />

        <Dialog.Portal keepMounted container={portalContainer}>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-bg/70 backdrop-blur-sm transition-opacity duration-300 data-[open]:opacity-100 data-[closed]:pointer-events-none data-[closed]:opacity-0" />

          <Dialog.Popup
            aria-label="Navigation"
            render={
              <motion.div
                animate={{ x: open ? 0 : '-100%' }}
                initial={false}
                transition={{ type: 'spring', stiffness: 340, damping: 34 }}
                className="fixed inset-y-0 left-0 z-50 flex w-[min(80vw,320px)] flex-col gap-1 border-r border-border bg-surface px-6 pt-28"
              />
            }
          >
            <nav className="flex flex-col gap-1" aria-label="Primary">
              {NAV_LINKS.map((link, i) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  style={{ transitionDelay: open ? `${i * 50 + 80}ms` : '0ms' }}
                  className={cn(
                    'rounded-[var(--radius-box)] px-2 py-2.5 font-mono text-xl font-bold transition-all duration-300',
                    open ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0',
                    isActive(link.href) ? 'text-gradient' : 'text-fg hover:text-accent'
                  )}
                >
                  <span className="text-accent-2">/</span>
                  {link.label.toLowerCase()}
                </a>
              ))}
            </nav>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
