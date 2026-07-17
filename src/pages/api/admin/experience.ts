/**
 * Admin experience actions. Handles the plain-form submissions from
 * /admin/experience/*. Behind the admin guard (middleware) + Cloudflare Access.
 */
import type { APIContext } from 'astro';
import { upsertExperience, deleteExperience } from '@lib/db/mutations';

export const prerender = false;

export async function POST({ request, redirect }: APIContext) {
  const form = await request.formData();
  const action = String(form.get('_action') ?? 'save');

  if (action === 'delete') {
    await deleteExperience(String(form.get('slug')));
    return redirect('/admin');
  }

  const highlights = String(form.get('highlights') ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const slug = await upsertExperience({
    slug: form.get('slug') ? String(form.get('slug')) : undefined,
    role: String(form.get('role') ?? ''),
    company: String(form.get('company') ?? ''),
    period: String(form.get('period') ?? ''),
    startDate: form.get('startDate') ? String(form.get('startDate')) : null,
    location: form.get('location') ? String(form.get('location')) : null,
    highlights,
    current: form.get('current') === 'on',
  });

  return redirect(`/admin?saved=${slug}`);
}
