/**
 * Admin image upload. Behind the admin guard (middleware) + Cloudflare Access
 * in production, same as the other /api/admin/* routes.
 *
 * Accepts multipart/form-data with a `file` field, stores it in the `UPLOADS`
 * R2 bucket keyed by a random id + original extension, and returns the public
 * URL under /uploads/<key> (served by src/pages/uploads/[...key].ts).
 */
import type { APIContext } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MiB

export async function POST({ request }: APIContext) {
  const form = await request.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return new Response(JSON.stringify({ error: `Unsupported type: ${file.type}` }), { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return new Response(JSON.stringify({ error: 'File too large (max 10MB)' }), { status: 400 });
  }

  const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
  const key = `${crypto.randomUUID()}${ext}`;

  await env.UPLOADS.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return new Response(JSON.stringify({ url: `/uploads/${key}` }), {
    headers: { 'content-type': 'application/json' },
  });
}
