/**
 * drizzle-kit config — LOCAL / CI ONLY.
 *
 * `npm run db:generate` diffs the schema and writes SQL migrations to
 * ./drizzle/migrations; `npm run db:migrate` applies them. Both run in plain
 * Node against DATABASE_URL from .env (dev branch) — never from inside a Worker.
 * To migrate production, point DATABASE_URL at the prod branch for one run.
 */
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('DATABASE_URL is not set — add it to .env before running drizzle-kit.');
}

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: { url },
  verbose: true,
  strict: true,
});
