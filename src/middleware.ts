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

export const onRequest = sequence(withLocals, withSecurityHeaders);
