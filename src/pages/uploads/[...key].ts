/**
 * Public read-through for the `UPLOADS` R2 bucket — R2 objects have no HTTP
 * URL of their own without a custom domain, so this route streams them back
 * out. Unauthenticated by design: uploaded images (post covers, project
 * covers) must be visible to logged-out visitors, same as /public assets.
 */
import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export async function GET({ params }: APIContext) {
  const key = params.key;
  if (!key) return new Response('Not found', { status: 404 });

  const object = await env.UPLOADS.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
