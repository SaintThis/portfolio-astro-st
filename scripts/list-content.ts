/** Quick read-only inventory of projects + posts in whatever DATABASE_URL points at. */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set.');
const db = drizzle(neon(url), { schema });

const projects = await db
  .select({
    slug: schema.projects.slug,
    title: schema.projects.title,
    category: schema.projects.category,
    views: schema.projects.views,
  })
  .from(schema.projects);

const posts = await db
  .select({ slug: schema.posts.slug, title: schema.posts.title })
  .from(schema.posts);

console.log('PROJECTS:');
for (const p of projects) console.log(`  ${p.slug} [${p.category}] views=${p.views} — ${p.title}`);
console.log('POSTS:');
for (const p of posts) console.log(`  ${p.slug} — ${p.title}`);
