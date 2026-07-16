/**
 * Row → domain-type mappers. The DB layer speaks in rows (`ProjectRow`,
 * `PostRow`); the rest of the app speaks in domain types (`Project`, `PostMeta`,
 * `PostFull`). Everything crossing that boundary goes through here, so a schema
 * tweak never leaks column names into components.
 */
import type { Project, PostMeta, PostFull } from '@lib/api/types';
import type { ProjectRow, PostRow } from './schema';

const iso = (d: Date | string): string =>
  (typeof d === 'string' ? new Date(d) : d).toISOString();

export function rowToProject(r: ProjectRow): Project {
  return {
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    description: r.description,
    tags: r.tags ?? [],
    category: r.category as Project['category'],
    date: iso(r.date),
    featured: r.featured,
    status: r.status as Project['status'],
    links: r.links ?? {},
    cover: r.cover ?? undefined,
    metrics: r.metrics ?? undefined,
  };
}

/** Lightweight post summary (list pages, related, RSS, sitemap). */
export function rowToPostMeta(r: PostRow): PostMeta {
  return {
    slug: r.slug,
    title: r.title,
    description: r.description,
    date: iso(r.date),
    updated: r.updated ? iso(r.updated) : undefined,
    tags: r.tags ?? [],
    draft: r.draft,
    readingTime: r.readingTime,
    cover: r.cover ?? undefined,
  };
}

/** Full post including rendered body + the fields the reading UI needs. */
export function rowToPostFull(r: PostRow): PostFull {
  const headings = (r.meta as { headings?: PostFull['headings'] } | null)?.headings;
  return {
    ...rowToPostMeta(r),
    bodyHtml: r.bodyHtml,
    bodyMarkdown: r.bodyMarkdown,
    category: r.category ?? undefined,
    series: r.series ?? undefined,
    heroVideo: r.heroVideo ?? undefined,
    ogImage: r.ogImage ?? undefined,
    featured: r.featured,
    views: r.views,
    headings: headings ?? [],
  };
}
