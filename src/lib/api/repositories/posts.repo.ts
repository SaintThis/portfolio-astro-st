/**
 * Posts repository — blog listing & detail.
 *
 * Source precedence: DB (Postgres) → Content Collections (local markdown).
 * When DATABASE_URL is set, posts are served live from Postgres; otherwise the
 * existing `src/content/blog/*.md` files back everything, so `astro dev` works
 * with zero DB setup and the markdown files stay a valid offline fallback.
 *
 * Both paths return the SAME shapes — `PostMeta` for lists, `PostFull` (with
 * pre-rendered `bodyHtml` + `headings`) for detail — so the blog pages never
 * branch on where a post came from.
 */
import type { PostMeta, PostFull } from '@lib/api/types';
import { dbEnabled, getDb, schema } from '@lib/db';
import { rowToPostMeta, rowToPostFull } from '@lib/db/mappers';
import { renderMarkdown } from '@lib/db/render-markdown';
import { readingTime } from '@lib/utils';
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { and, desc, eq } from 'drizzle-orm';

/** Drafts are visible in dev, hidden in production — same rule as before. */
const showDrafts = !import.meta.env.PROD;

// --- Content-Collections fallback helpers ---------------------------------

function ccToMeta(entry: CollectionEntry<'blog'>): PostMeta {
  return {
    slug: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    date: entry.data.date.toISOString(),
    updated: entry.data.updated?.toISOString(),
    tags: entry.data.tags,
    draft: entry.data.draft,
    readingTime: readingTime(entry.body ?? ''),
    cover: typeof entry.data.cover === 'string' ? entry.data.cover : entry.data.cover?.src,
  };
}

async function ccToFull(entry: CollectionEntry<'blog'>): Promise<PostFull> {
  const { html, headings } = await renderMarkdown(entry.body ?? '');
  return {
    ...ccToMeta(entry),
    bodyHtml: html,
    bodyMarkdown: entry.body ?? '',
    category: entry.data.category,
    series: entry.data.series,
    heroVideo: entry.data.heroVideo,
    ogImage: entry.data.ogImage,
    featured: entry.data.featured,
    headings,
  };
}

// --- Public API ------------------------------------------------------------

export async function getPosts(): Promise<PostMeta[]> {
  if (dbEnabled()) {
    const where = showDrafts ? undefined : eq(schema.posts.draft, false);
    const rows = await getDb()
      .select()
      .from(schema.posts)
      .where(where)
      .orderBy(desc(schema.posts.date));
    return rows.map(rowToPostMeta);
  }
  const entries = await getCollection('blog', ({ data }) => showDrafts || !data.draft);
  return entries.map(ccToMeta).sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export async function getPost(slug: string): Promise<PostFull | undefined> {
  if (dbEnabled()) {
    const [row] = await getDb()
      .select()
      .from(schema.posts)
      .where(and(eq(schema.posts.slug, slug), showDrafts ? undefined : eq(schema.posts.draft, false)))
      .limit(1);
    return row ? rowToPostFull(row) : undefined;
  }
  const entry = await getEntry('blog', slug);
  if (!entry || (!showDrafts && entry.data.draft)) return undefined;
  return ccToFull(entry);
}
