/**
 * Astro-side database client (read path).
 *
 * Uses Neon's HTTP driver (`drizzle-orm/neon-http`) — fetch-based, so it runs
 * natively in the Cloudflare Worker with no Hyperdrive/TCP setup. Single
 * round-trip per query; no `db.transaction()` (fine for our read/CRUD needs — if
 * a future feature needs atomic multi-table writes, switch that call site to
 * `drizzle-orm/neon-serverless`).
 *
 * The connection string is read via `astro:env/server`'s `getSecret` — a *lazy*
 * runtime accessor. This matters on Cloudflare: Workers have no ambient env at
 * module-eval time, so we must not read the secret at import; `getDb()` reads it
 * on first call (dev: `.env`, prod: the Worker secret) and memoizes the client.
 *
 * The standalone `mcp-server/` does NOT use this file — it builds its own client
 * from `process.env.DATABASE_URL` (plain Node), sharing only `./schema`.
 */
import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { getSecret } from 'astro:env/server';
import * as schema from './schema';

let _db: NeonHttpDatabase<typeof schema> | null = null;

/** True when a DATABASE_URL is configured — repositories branch on this. */
export function dbEnabled(): boolean {
  return !!getSecret('DATABASE_URL');
}

/** Lazily construct (and memoize) the Drizzle client. Throws if unconfigured. */
export function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  const url = getSecret('DATABASE_URL');
  if (!url) {
    throw new Error('DATABASE_URL is not set — cannot open a database connection.');
  }
  _db = drizzle(neon(url), { schema });
  return _db;
}

export { schema };
