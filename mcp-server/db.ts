/**
 * MCP-server database client (WRITE path).
 *
 * Standalone Node — builds its own Neon client from process.env, sharing only
 * the schema with the Astro app (the app's own client uses astro:env, which
 * doesn't exist outside the Astro runtime). Which database this points at is
 * decided entirely by the DATABASE_URL in the `.mcp.json` entry that launched
 * this process — that's the local-vs-prod split.
 */
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/db/schema.ts';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set — the MCP server cannot start without a target database.');
}

/** Human-readable target label for tool responses ("local" | "prod" | custom). */
export const TARGET = process.env.MCP_TARGET ?? 'unlabeled';

export const db = drizzle(neon(url), { schema });
export { schema };
