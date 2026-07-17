/**
 * One-off migration: copies the 4 entries from src/data/experience.ts into the
 * `experience` table. Run once per environment (dev now, prod when approved).
 * Idempotent via upsert-by-slug, so re-running is safe.
 *
 * Not part of scripts/seed.ts because this is a one-time cutover, not a
 * recurring "refresh from markdown" seed — after this runs and prod is
 * confirmed, src/data/experience.ts gets emptied and this script becomes dead
 * (kept for history / re-running only if a full DB reset is ever needed).
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema.ts';
import { EXPERIENCE } from '../src/data/experience.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is not set — add it to .env.');

const db = drizzle(neon(url), { schema });

// Approximate start date from the leading "Mon YYYY" in `period` — used only
// for sort order, never displayed (the UI shows `period` verbatim).
function parseStartDate(period: string): Date {
  const match = period.match(/([A-Za-z]{3,9})\s+(\d{4})/);
  if (!match) return new Date();
  const parsed = new Date(`${match[1]} 1, ${match[2]}`);
  return isNaN(+parsed) ? new Date() : parsed;
}

async function main() {
  for (const e of EXPERIENCE) {
    const row = {
      slug: e.slug,
      role: e.role,
      company: e.company,
      period: e.period,
      startDate: parseStartDate(e.period),
      location: e.location ?? null,
      highlights: e.highlights,
      current: e.current,
      updatedAt: new Date(),
    };
    await db
      .insert(schema.experience)
      .values(row)
      .onConflictDoUpdate({ target: schema.experience.slug, set: row });
  }
  console.log(`✓ Migrated ${EXPERIENCE.length} experience entries`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
