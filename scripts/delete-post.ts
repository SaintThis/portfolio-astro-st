/**
 * Delete a blog post by slug from whatever DATABASE_URL points at.
 * Used to retire the Nocturne write-up once it moved to /projects/nocturne-market.
 *
 *   npx tsx scripts/delete-post.ts <slug>
 *   npx dotenv-cli -e .env.production -- npx tsx scripts/delete-post.ts <slug>
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema.ts';

const slug = process.argv[2];
if (!slug) throw new Error('Usage: tsx scripts/delete-post.ts <slug>');

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set.');
const db = drizzle(neon(url), { schema });

const [existing] = await db
  .select({ slug: schema.posts.slug, title: schema.posts.title })
  .from(schema.posts)
  .where(eq(schema.posts.slug, slug));

if (!existing) {
  console.log(`no post with slug "${slug}" — nothing to delete.`);
} else {
  await db.delete(schema.posts).where(eq(schema.posts.slug, slug));
  console.log(`deleted post: ${existing.slug} — ${existing.title}`);
}
