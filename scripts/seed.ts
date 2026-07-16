/**
 * Seed script — LOCAL ONLY. Loads the local fixtures into whatever DATABASE_URL
 * points at (your dev branch). Idempotent: upserts by slug, so re-running just
 * refreshes rows. Run with `npm run db:seed`.
 *
 * Standalone Node (not the Astro runtime), so it builds its own Neon client from
 * process.env rather than going through `@lib/db` (which uses astro:env). It
 * shares only the schema. The `import type` in the data file is erased at
 * runtime, so no path-alias resolution is needed here.
 */
import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema.ts';
import { PROJECTS } from '../src/data/projects.ts';
import { renderMarkdown } from '../src/lib/db/render-markdown.ts';
import { readingTime } from '../src/lib/utils/format.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set — add it to .env.');

const db = drizzle(neon(url), { schema });
const BLOG_DIR = join(process.cwd(), 'src/content/blog');

async function seedProjects() {
  for (const p of PROJECTS) {
    await db
      .insert(schema.projects)
      .values({
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        description: p.description,
        tags: p.tags,
        category: p.category,
        date: new Date(p.date),
        featured: p.featured,
        status: p.status,
        links: p.links,
        cover: p.cover ?? null,
        metrics: p.metrics ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.projects.slug,
        set: {
          title: p.title,
          summary: p.summary,
          description: p.description,
          tags: p.tags,
          category: p.category,
          date: new Date(p.date),
          featured: p.featured,
          status: p.status,
          links: p.links,
          cover: p.cover ?? null,
          metrics: p.metrics ?? null,
          updatedAt: new Date(),
        },
      });
  }
  console.log(`✓ Seeded ${PROJECTS.length} projects`);
}

async function seedPosts() {
  const files = readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f));
  for (const file of files) {
    const slug = file.replace(/\.mdx?$/, '');
    const raw = readFileSync(join(BLOG_DIR, file), 'utf8');
    const { data, content } = matter(raw);
    const { html, headings } = await renderMarkdown(content);

    const row = {
      slug,
      title: String(data.title),
      description: String(data.description),
      date: new Date(data.date),
      updated: data.updated ? new Date(data.updated) : null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      draft: Boolean(data.draft ?? false),
      category: data.category ?? null,
      series: data.series ?? null,
      heroVideo: data.heroVideo ?? null,
      cover: typeof data.cover === 'string' ? data.cover : null,
      ogImage: data.ogImage ?? null,
      featured: Boolean(data.featured ?? false),
      bodyMarkdown: content,
      bodyHtml: html,
      readingTime: readingTime(content),
      meta: { headings },
      updatedAt: new Date(),
    };

    await db
      .insert(schema.posts)
      .values(row)
      .onConflictDoUpdate({ target: schema.posts.slug, set: row });
  }
  console.log(`✓ Seeded ${files.length} posts`);
}

async function main() {
  await seedProjects();
  await seedPosts();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
