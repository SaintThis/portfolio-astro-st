/**
 * View tracking. A view "counts" only when the reader qualified (dwell + scroll,
 * enforced client-side before the request fires) AND is a new (post, visitor,
 * day) tuple — the unique index on post_views dedups so a refresh or revisit
 * within 24h doesn't inflate the count.
 *
 * `visitorHash` is a SHA-256 of IP + UA + day + salt — never a raw IP stored
 * (privacy). No cookies, so no consent banner needed.
 */
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { getDb, schema } from './client';

const enc = new TextEncoder();

export async function hashVisitor(ip: string, ua: string, day: string): Promise<string> {
  const salt = 'st-views-v1';
  const data = enc.encode(`${ip}|${ua}|${day}|${salt}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Record a qualified view. Returns the (possibly unchanged) total. Inserts a
 * dedup row; only when that insert is new do we increment posts.views — so the
 * count reflects unique daily visitors, not raw hits.
 */
export async function recordView(slug: string, visitorHash: string): Promise<number> {
  const db = getDb();
  const inserted = await db
    .insert(schema.postViews)
    .values({ postSlug: slug, visitorHash, day: today() })
    .onConflictDoNothing()
    .returning({ id: schema.postViews.id });

  if (inserted.length > 0) {
    const [row] = await db
      .update(schema.posts)
      .set({ views: sql`${schema.posts.views} + 1` })
      .where(eq(schema.posts.slug, slug))
      .returning({ views: schema.posts.views });
    return row?.views ?? 0;
  }
  return getViews(slug);
}

export async function getViews(slug: string): Promise<number> {
  const [row] = await getDb()
    .select({ views: schema.posts.views })
    .from(schema.posts)
    .where(eq(schema.posts.slug, slug))
    .limit(1);
  return row?.views ?? 0;
}
