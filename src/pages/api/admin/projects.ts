/**
 * Admin project actions. Handles the plain-form submissions from /admin/projects/*.
 * Behind the admin guard (middleware) + Cloudflare Access in production.
 */
import type { APIContext } from 'astro';
import { upsertProject, deleteProject } from '@lib/db/mutations';

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
    await deleteProject(String(form.get('slug')));
    return redirect('/admin');
  }

  const links: Record<string, string> = {};
  for (const key of ['live', 'repo', 'caseStudy'] as const) {
    const val = form.get(key);
    if (val) links[key] = String(val);
  }

  const slug = await upsertProject({
    slug: form.get('slug') ? String(form.get('slug')) : undefined,
    title: String(form.get('title') ?? ''),
    summary: String(form.get('summary') ?? ''),
    description: String(form.get('description') ?? ''),
    tags: csv(form.get('tags')),
    category: String(form.get('category') ?? 'web'),
    status: String(form.get('status') ?? 'live'),
    date: form.get('date') ? String(form.get('date')) : null,
    featured: form.get('featured') === 'on',
    links,
    cover: form.get('cover') ? String(form.get('cover')) : null,
  });

  return redirect(`/admin?saved=${slug}`);
}
