/**
 * Write operations for the admin UI (SSR API routes). Runs inside the Worker,
 * so it renders markdown here at save time (same pipeline as seed/MCP) and
 * stores the HTML + TOC headings. Single place the render-on-write lives for the
 * admin path.
 */
import { eq } from 'drizzle-orm';
import { getDb, schema } from './client';
import { renderMarkdown } from './render-markdown';
import { readingTime, slugify } from '@lib/utils';

export interface PostInput {
  slug?: string;
  title: string;
  description: string;
  markdown: string;
  tags?: string[];
  category?: string | null;
  series?: string | null;
  heroVideo?: string | null;
  cover?: string | null;
  date?: string | null;
  draft?: boolean;
  featured?: boolean;
}

export async function upsertPost(input: PostInput): Promise<string> {
  const slug = slugify(input.slug || input.title);
  const { html, headings } = await renderMarkdown(input.markdown);
  const row = {
    slug,
    title: input.title,
    description: input.description,
    date: input.date ? new Date(input.date) : new Date(),
    tags: input.tags ?? [],
    draft: input.draft ?? false,
    category: input.category ?? null,
    series: input.series ?? null,
    heroVideo: input.heroVideo ?? null,
    cover: input.cover ?? null,
    featured: input.featured ?? false,
    bodyMarkdown: input.markdown,
    bodyHtml: html,
    readingTime: readingTime(input.markdown),
    meta: { headings },
    updatedAt: new Date(),
  };
  await getDb()
    .insert(schema.posts)
    .values(row)
    .onConflictDoUpdate({ target: schema.posts.slug, set: { ...row, date: undefined } });
  return slug;
}

export async function deletePost(slug: string): Promise<void> {
  await getDb().delete(schema.posts).where(eq(schema.posts.slug, slug));
}

export interface ProjectInput {
  slug?: string;
  title: string;
  summary: string;
  description?: string;
  tags?: string[];
  category: string;
  status?: string;
  date?: string | null;
  featured?: boolean;
  links?: Record<string, string>;
  cover?: string | null;
}

export async function upsertProject(input: ProjectInput): Promise<string> {
  const slug = slugify(input.slug || input.title);
  const row = {
    slug,
    title: input.title,
    summary: input.summary,
    description: input.description ?? '',
    tags: input.tags ?? [],
    category: input.category,
    status: input.status ?? 'live',
    date: input.date ? new Date(input.date) : new Date(),
    featured: input.featured ?? false,
    links: input.links ?? {},
    cover: input.cover ?? null,
    updatedAt: new Date(),
  };
  await getDb()
    .insert(schema.projects)
    .values(row)
    .onConflictDoUpdate({ target: schema.projects.slug, set: { ...row, date: undefined } });
  return slug;
}

export async function deleteProject(slug: string): Promise<void> {
  await getDb().delete(schema.projects).where(eq(schema.projects.slug, slug));
}

export interface ExperienceInput {
  slug?: string;
  role: string;
  company: string;
  period: string;
  startDate?: string | null;
  location?: string | null;
  highlights?: string[];
  current?: boolean;
}

export async function upsertExperience(input: ExperienceInput): Promise<string> {
  const slug = slugify(input.slug || `${input.role}-${input.company}`);
  const row = {
    slug,
    role: input.role,
    company: input.company,
    period: input.period,
    startDate: input.startDate ? new Date(input.startDate) : new Date(),
    location: input.location ?? null,
    highlights: input.highlights ?? [],
    current: input.current ?? false,
    updatedAt: new Date(),
  };
  await getDb()
    .insert(schema.experience)
    .values(row)
    .onConflictDoUpdate({ target: schema.experience.slug, set: row });
  return slug;
}

export async function deleteExperience(slug: string): Promise<void> {
  await getDb().delete(schema.experience).where(eq(schema.experience.slug, slug));
}
