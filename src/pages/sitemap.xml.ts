/**
 * Dynamic sitemap. Replaces the build-time @astrojs/sitemap integration: now
 * that posts/projects live in the DB and can appear without a rebuild, the
 * sitemap must be generated at request time so new URLs show up immediately.
 *
 * Emits the static routes plus one <url> per DB-backed post and project.
 */
import type { APIContext } from 'astro';
import { SITE } from '@/config';
import { getPosts, getProjects } from '@lib/api';
import { isoDate } from '@lib/utils';

export const prerender = false;

const STATIC_ROUTES = ['/', '/about', '/projects', '/blog', '/contact'];

export async function GET(context: APIContext) {
  const base = (context.site ?? SITE.url).toString().replace(/\/$/, '');
  const [posts, projects] = await Promise.all([getPosts(), getProjects()]);

  const url = (loc: string, lastmod?: string, priority = 0.7) =>
    `  <url>\n    <loc>${base}${loc}</loc>` +
    (lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '') +
    `\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

  const urls = [
    ...STATIC_ROUTES.map((r) => url(r, undefined, r === '/' ? 1.0 : 0.8)),
    ...posts.map((p) => url(`/blog/${p.slug}`, isoDate(p.updated ?? p.date), 0.7)),
    ...projects.map((p) => url(`/projects/${p.slug}`, isoDate(p.date), 0.6)),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
