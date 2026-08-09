/**
 * Project view-count endpoint — the projects mirror of /api/views/:slug.
 *   GET  /api/project-views/:slug  → { views }
 *   POST /api/project-views/:slug  → records a *qualified* view (dedup per
 *                                    visitor/day), returns updated { views }.
 *
 * Separate route (not a ?type= param on the post endpoint) so a project slug and
 * a post slug can never be confused for one another.
 */
import type { APIContext } from 'astro';
import { PROJECTS } from '@/config';
import { dbEnabled } from '@lib/db';
import { getProjectViews, recordProjectView, hashVisitor, today } from '@lib/db/views';

export const prerender = false;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function GET({ params }: APIContext) {
  if (!PROJECTS.viewCounts || !dbEnabled()) return json({ views: 0 });
  return json({ views: await getProjectViews(params.slug!) });
}

export async function POST({ params, request }: APIContext) {
  if (!PROJECTS.viewCounts || !dbEnabled()) return json({ views: 0 });

  const slug = params.slug!;
  // Cloudflare provides the client IP via this header; `Astro.clientAddress`
  // isn't supported by the CF adapter. Falls back to UA-only in local dev.
  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const ua = request.headers.get('user-agent') ?? 'unknown';
  const visitor = await hashVisitor(ip, ua, today());

  try {
    return json({ views: await recordProjectView(slug, visitor) });
  } catch {
    return json({ views: await getProjectViews(slug) });
  }
}
