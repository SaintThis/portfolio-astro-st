import type { APIContext } from 'astro';
import { SITE } from '@/config';

export function GET(context: APIContext) {
  const sitemap = new URL('sitemap.xml', context.site ?? SITE.url).href;
  const body = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${sitemap}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
