/**
 * Shared helpers for the MCP tools: the write guard, response builders, and the
 * auto-categorizer.
 */
import { BLOG } from '../src/config.ts';
import { slugify } from '../src/lib/utils/format.ts';
import { TARGET } from './db.ts';

export const CATEGORY_SLUGS = BLOG.categories.map((c) => c.slug);

/**
 * Write guard. Protects against accidental / unauthorized mutations, especially
 * against production:
 *  - When `MCP_WRITE_TOKEN` is set on the server (do this for the prod entry),
 *    every mutating call must pass a matching `writeToken` — a deliberate,
 *    human-supplied gate before anything reaches the live database.
 *  - When it's unset (local dev), writes are frictionless.
 * `confirm` must always be true, so an agent never writes without meaning to.
 */
export function assertWritable(args: { confirm?: boolean; writeToken?: string }) {
  if (args.confirm !== true) {
    throw new Error(
      `Refusing to write to the "${TARGET}" database without confirm: true. ` +
        `Set confirm: true only when the user has explicitly asked to save/publish.`
    );
  }
  const expected = process.env.MCP_WRITE_TOKEN;
  if (expected && args.writeToken !== expected) {
    throw new Error(
      `Writes to the "${TARGET}" database require a valid writeToken. ` +
        `Ask the user for it — do not guess.`
    );
  }
}

/** Standard success payload for a tool. */
export function ok(text: string, structuredContent?: Record<string, unknown>) {
  return {
    content: [{ type: 'text' as const, text }],
    ...(structuredContent ? { structuredContent } : {}),
  };
}

/** Standard error payload — surfaced to the model as an error result. */
export function fail(message: string) {
  return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
}

export function toSlug(input: string): string {
  return slugify(input);
}

/**
 * Suggest the best-fit blog category from the allowed list by keyword scoring.
 * Used when a post is created without an explicit category — the "auto-categorize
 * on prompt" behavior. Returns a slug from BLOG.categories, or null if nothing
 * scores (caller can then leave it uncategorized or ask).
 */
const SYNONYMS: Record<string, string[]> = {
  engineering: ['engineering', 'scalab', 'infrastructure', 'deploy', 'pipeline', 'ci/cd', 'observability', 'system'],
  architecture: ['architecture', 'design pattern', 'microservice', 'microfrontend', 'monolith', 'module federation', 'boundaries', 'coupling'],
  frontend: ['frontend', 'react', 'css', 'ui', 'ux', 'browser', 'astro', 'vue', 'svelte', 'tailwind', 'component', 'accessibility'],
  backend: ['backend', 'api', 'database', 'sql', 'postgres', 'server', 'node', 'django', 'auth', 'orm', 'drizzle'],
  rust: ['rust', 'cargo', 'wasm', 'borrow checker', 'memory safety', 'ownership'],
  career: ['career', 'interview', 'hiring', 'resume', 'productivity', 'soft skill', 'mentor', 'growth'],
};

export function suggestCategory(text: string): string | null {
  const hay = text.toLowerCase();
  let best: string | null = null;
  let bestScore = 0;
  for (const c of BLOG.categories) {
    const keys = SYNONYMS[c.slug] ?? [c.slug, c.label.toLowerCase()];
    let score = 0;
    for (const k of keys) score += hay.split(k).length - 1;
    if (score > bestScore) {
      bestScore = score;
      best = c.slug;
    }
  }
  return bestScore > 0 ? best : null;
}
