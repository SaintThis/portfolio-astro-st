import type { ExperienceItem } from '@lib/api/types';

/**
 * Local fallback only — real content lives in Postgres (see `src/lib/db/schema.ts`,
 * table `experience`), managed via `/admin` or the MCP server. `meta.repo.ts`
 * only reads this array when `DATABASE_URL` isn't set (e.g. a fresh local clone
 * with no DB configured yet). Left empty deliberately — see `src/data/projects.ts`
 * for the same pattern and reasoning.
 */
export const EXPERIENCE: ExperienceItem[] = [];
