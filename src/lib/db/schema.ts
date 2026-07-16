/**
 * Drizzle schema — the database shape behind projects & blog posts.
 *
 * Design goals:
 *  - Columns map 1:1 onto the domain types in `src/lib/api/types.ts`, so the
 *    repository layer maps a row → `Project`/`PostFull` with no surprises.
 *  - Flexible-by-default: array/object-ish fields are `jsonb` (add a key without
 *    a migration), and every table carries a `meta` jsonb catch-all for ad-hoc
 *    fields you haven't formalized yet. Prefer adding a real column once a field
 *    matters for querying/sorting.
 *  - This file is imported by BOTH the Astro app (read path) and the standalone
 *    `mcp-server/` (write path), so it stays dependency-light.
 */
import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

/** Tech-stack projects. Backs `getProjects()` / `getProject()`. */
export const projects = pgTable(
  'projects',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    description: text('description').notNull().default(''),
    /** string[] — tech tags. */
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    /** 'web' | 'backend' | 'tooling' | 'mobile' | 'experiment' (validated in app). */
    category: text('category').notNull(),
    /** When it shipped / was last worked on. */
    date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
    featured: boolean('featured').notNull().default(false),
    /** 'live' | 'wip' | 'archived'. */
    status: text('status').notNull().default('live'),
    /** { live?, repo?, caseStudy? }. */
    links: jsonb('links').$type<Record<string, string>>().notNull().default({}),
    cover: text('cover'),
    /** { label, value }[] — optional headline metrics. */
    metrics: jsonb('metrics').$type<{ label: string; value: string }[]>(),
    /** Catch-all for fields not yet promoted to real columns. */
    meta: jsonb('meta').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('projects_date_idx').on(t.date), index('projects_featured_idx').on(t.featured)]
);

/** Blog posts. Backs `getPosts()` / `getPost()`. Stores both the raw markdown
 *  and a pre-rendered HTML snapshot (rendered at write time, so reads are cheap). */
export const posts = pgTable(
  'posts',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
    updated: timestamp('updated', { withTimezone: true }),
    tags: jsonb('tags').$type<string[]>().notNull().default([]),
    draft: boolean('draft').notNull().default(false),
    /** Single primary bucket — drives the blog index category chips. */
    category: text('category'),
    /** Groups multi-part posts. */
    series: text('series'),
    /** YouTube/Vimeo/MP4 URL rendered above the body. */
    heroVideo: text('hero_video'),
    cover: text('cover'),
    ogImage: text('og_image'),
    featured: boolean('featured').notNull().default(false),
    /** Source of truth for editing. */
    bodyMarkdown: text('body_markdown').notNull().default(''),
    /** Pre-rendered at write time — what the page actually renders. */
    bodyHtml: text('body_html').notNull().default(''),
    readingTime: integer('reading_time').notNull().default(1),
    /** Lifetime view count (see post_views for the dedup/qualification log). */
    views: integer('views').notNull().default(0),
    meta: jsonb('meta').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('posts_date_idx').on(t.date),
    index('posts_draft_idx').on(t.draft),
    index('posts_category_idx').on(t.category),
  ]
);

/**
 * Qualified view events — one row per (post, visitor, day). The unique index is
 * what enforces "count a visitor at most once per 24h"; the app only inserts a
 * row after the reader qualifies (dwell + scroll), then increments posts.views.
 * `visitorHash` is a salted hash of IP+UA+day — never a raw IP (privacy).
 */
export const postViews = pgTable(
  'post_views',
  {
    id: serial('id').primaryKey(),
    postSlug: text('post_slug').notNull(),
    visitorHash: text('visitor_hash').notNull(),
    day: text('day').notNull(), // YYYY-MM-DD bucket
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('post_views_unique_idx').on(t.postSlug, t.visitorHash, t.day)]
);

export type ProjectRow = typeof projects.$inferSelect;
export type PostRow = typeof posts.$inferSelect;
export type NewProjectRow = typeof projects.$inferInsert;
export type NewPostRow = typeof posts.$inferInsert;
