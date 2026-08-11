/**
 * Astro middleware — runs on every request in SSR/hybrid mode.
 *
 * In `output: 'static'` this executes at build time. The moment you switch to
 * `output: 'server'` (when the backend lands), this becomes your per-request
 * hook for auth, redirects, i18n, rate-limiting, and security headers.
 *
 * Keep concerns as small, composable functions and compose them with
 * `sequence(...)` so each stays single-responsibility (SRP).
 */
import { defineMiddleware, sequence } from 'astro:middleware';
import { SITE, THEMES, DEFAULT_THEME, type ThemeId } from '@/config';

const THEME_IDS = new Set<string>(THEMES.map((t) => t.id));

/**
 * Admin guard (defense-in-depth). `/admin` and `/api/admin` are meant to sit
 * behind Cloudflare Access (Zero Trust) at the edge, which injects a verified
 * `Cf-Access-Authenticated-User-Email` header. This checks that header matches
 * the owner so a misconfigured Access policy isn't the *only* gate. In local dev
 * there's no Access in front, so it's allowed through for editing.
 */
const withAdminGuard = defineMiddleware(async (context, next) => {
  const p = context.url.pathname;
  if (!p.startsWith('/admin') && !p.startsWith('/api/admin')) return next();
  if (import.meta.env.DEV) return next();

  const email = context.request.headers.get('cf-access-authenticated-user-email');
  if (!email || email.toLowerCase() !== SITE.email.toLowerCase()) {
    return new Response('Forbidden', { status: 403 });
  }
  return next();
});

/** Attach request-scoped data to `Astro.locals` (typed in src/env.d.ts). */
const withLocals = defineMiddleware(async (context, next) => {
  context.locals.requestId = crypto.randomUUID();
  context.locals.startedAt = Date.now();

  // Theme drives the server-rendered LAYOUT (which hero/nav/card variant to
  // render), so it has to be resolved per request. Validate against the real
  // registry — an unknown or tampered cookie must never reach a component
  // lookup, or the dispatcher would fall through to nothing.
  const cookie = context.cookies.get('theme')?.value;
  context.locals.theme = cookie && THEME_IDS.has(cookie) ? (cookie as ThemeId) : DEFAULT_THEME;

  return next();
});

/** Baseline security headers. Tune the CSP as you add third-party origins. */
const withSecurityHeaders = defineMiddleware(async (_context, next) => {
  const response = await next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  // HTML now renders different markup per theme, keyed on a cookie — so a
  // shared cache must never hand one visitor's layout to another. Scoped to
  // HTML on purpose: this middleware also wraps /api/* and sitemap.xml, and
  // the sitemap deliberately sets its own s-maxage that a blanket no-store
  // would silently destroy.
  if (response.headers.get('content-type')?.includes('text/html')) {
    response.headers.append('Vary', 'Cookie');
    response.headers.set('Cache-Control', 'private, no-store');
  }

  return response;
});

export const onRequest = sequence(withAdminGuard, withLocals, withSecurityHeaders);
