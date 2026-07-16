/**
 * Admin post actions. Handles the plain-form submissions from /admin/posts/*.
 * Behind the admin guard (middleware) + Cloudflare Access in production.
 */
import type { APIContext } from 'astro';
import { upsertPost, deletePost } from '@lib/db/mutations';

export const prerender = false;

const csv = (v: FormDataEntryValue | null): string[] =>
  (v ? String(v) : '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export async function POST({ request, redirect }: APIContext) {
  const form = await request.formData();
  const action = String(form.get('_action') ?? 'save');

  if (action === 'delete') {
    await deletePost(String(form.get('slug')));
    return redirect('/admin');
  }

  const slug = await upsertPost({
    slug: form.get('slug') ? String(form.get('slug')) : undefined,
    title: String(form.get('title') ?? ''),
    description: String(form.get('description') ?? ''),
    markdown: String(form.get('markdown') ?? ''),
    tags: csv(form.get('tags')),
    category: form.get('category') ? String(form.get('category')) : null,
    series: form.get('series') ? String(form.get('series')) : null,
    heroVideo: form.get('heroVideo') ? String(form.get('heroVideo')) : null,
    cover: form.get('cover') ? String(form.get('cover')) : null,
    date: form.get('date') ? String(form.get('date')) : null,
    draft: form.get('draft') === 'on',
    featured: form.get('featured') === 'on',
  });

  return redirect(`/admin?saved=${slug}`);
}
