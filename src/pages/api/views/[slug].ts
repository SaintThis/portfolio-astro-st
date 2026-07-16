/**
 * View-count endpoint.
 *   GET  /api/views/:slug  → { views }
 *   POST /api/views/:slug  → records a *qualified* view (dedup per visitor/day),
 *                            returns the updated { views }.
 *
 * Qualification (dwell ≥10s + scrolled ≥25%) is enforced client-side before the
 * POST fires; the server enforces the once-per-visitor-per-day dedup. No-ops
 * gracefully when the DB or the feature flag is off.
 */
import type { APIContext } from 'astro';
import { BLOG } from '@/config';
import { dbEnabled } from '@lib/db';
import { getViews, recordView, hashVisitor, today } from '@lib/db/views';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function GET({ params }: APIContext) {
  if (!BLOG.viewCounts || !dbEnabled()) return json({ views: 0 });
  return json({ views: await getViews(params.slug!) });
}

export async function POST({ params, request }: APIContext) {
  if (!BLOG.viewCounts || !dbEnabled()) return json({ views: 0 });

  const slug = params.slug!;
  // Cloudflare provides the client IP via this header; `Astro.clientAddress`
  // isn't supported by the CF adapter. Falls back to UA-only in local dev.
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? 'unknown';
  const visitor = await hashVisitor(ip, ua, today());

  try {
    return json({ views: await recordView(slug, visitor) });
  } catch {
    return json({ views: await getViews(slug) });
  }
}
