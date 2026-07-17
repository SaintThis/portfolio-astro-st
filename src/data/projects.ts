import type { Project } from '@lib/api/types';

/**
 * Local fallback only — real content lives in Postgres (see `src/lib/db/schema.ts`),
 * managed via `/admin` or the MCP server. `projects.repo.ts` only reads this array
 * when `DATABASE_URL` isn't set (e.g. a fresh local clone with no DB configured
 * yet). Left empty deliberately: stale placeholder projects here would be
 * confusing to read as "the fallback" when someone expects real data.
 */
export const PROJECTS: Project[] = [];
