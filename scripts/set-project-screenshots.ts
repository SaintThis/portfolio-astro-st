/**
 * One-off: set a project's real cover + screenshot gallery. Screenshots live in
 * the `meta` jsonb catch-all (see schema.ts) rather than a dedicated column,
 * since this is exactly the "field not yet promoted to a real column" case that
 * column exists for. Run with `npm run db:seed` env pattern, e.g.:
 *   npx tsx scripts/set-project-screenshots.ts
 *   dotenv -e .env.production -- npx tsx scripts/set-project-screenshots.ts
 */
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set — add it to .env.');

const db = drizzle(neon(url), { schema });

const SLUG = 'sundry';
const COVER = '/uploads/sundry/home-light.png';
const SCREENSHOTS = [
  '/uploads/sundry/home-dark.png',
  '/uploads/sundry/browse-light.png',
  '/uploads/sundry/product-light.png',
];

async function main() {
  const [existing] = await db.select().from(schema.projects).where(eq(schema.projects.slug, SLUG));
  if (!existing) throw new Error(`No project with slug "${SLUG}" found.`);

  await db
    .update(schema.projects)
    .set({
      cover: COVER,
      meta: { ...(existing.meta as Record<string, unknown>), screenshots: SCREENSHOTS },
      updatedAt: new Date(),
    })
    .where(eq(schema.projects.slug, SLUG));

  console.log(`Updated "${SLUG}": cover=${COVER}, screenshots=${SCREENSHOTS.length}`);
}

main();
