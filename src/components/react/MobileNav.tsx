import { useEffect, useState } from 'react';
import { NAV_LINKS } from '@/config';
import { cn } from '@lib/utils';

/**
 * Mobile navigation (hamburger → full-screen overlay).
 * Kept as its own small island so the desktop header ships zero JS for nav.
 */
export default function MobileNav({ pathname = '/' }: { pathname?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
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

      <div
        className={cn(
          'fixed inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-bg/98 backdrop-blur transition-all duration-300',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <nav className="flex flex-col items-center gap-4">
          {NAV_LINKS.map((link, i) => {
            const isActive = pathname === link.href;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{ transitionDelay: open ? `${i * 60 + 100}ms` : '0ms' }}
                className={cn(
                  'font-mono text-3xl font-bold transition-all duration-300',
                  open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
                  isActive ? 'text-gradient' : 'text-fg hover:text-accent'
                )}
              >
                <span className="text-accent-2">/</span>
                {link.label.toLowerCase()}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
