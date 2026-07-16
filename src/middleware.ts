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
import { SITE } from '@/config';

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
  // Example seam: context.locals.user = await getUserFromSession(context.cookies);
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

  return response;
});

export const onRequest = sequence(withAdminGuard, withLocals, withSecurityHeaders);
